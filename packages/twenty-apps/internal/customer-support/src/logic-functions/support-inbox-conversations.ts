import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  SUPPORT_INBOX_CONVERSATION_PAGE_SIZE,
  SUPPORT_INBOX_CONVERSATIONS_ROUTE_PATH,
} from '../constants/crisp';
import { SUPPORT_INBOX_CONVERSATIONS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import {
  type SupportInboxCounts,
  type SupportInboxTab,
} from '../types/support-inbox';
import { readCrispSyncState } from './utils/crisp-sync-state.util';
import {
  isCrispApiConfigured,
  readCrispSettings,
} from './utils/read-crisp-settings.util';
import { runRoute } from './utils/run-route.util';
import {
  SUPPORT_INBOX_CONVERSATION_SELECTION,
  toSupportInboxConversation,
} from './utils/support-inbox-selection.util';

type ConversationsBody = {
  tab?: SupportInboxTab;
  appName?: string | null;
  search?: string | null;
  after?: string | null;
};

const TABS: SupportInboxTab[] = ['waiting', 'open', 'resolved', 'all'];

const OPEN_STATUSES = ['PENDING', 'UNRESOLVED'];

const buildTabFilter = (tab: SupportInboxTab): Record<string, unknown> => {
  switch (tab) {
    case 'waiting':
      return {
        waitingSince: { is: 'NOT_NULL' },
        status: { in: OPEN_STATUSES },
      };
    case 'open':
      return { status: { in: OPEN_STATUSES } };
    case 'resolved':
      return { status: { eq: 'RESOLVED' } };
    default:
      return {};
  }
};

const buildScopeFilter = ({
  appName,
  search,
}: {
  appName: string | null;
  search: string | null;
}): Record<string, unknown>[] => {
  const filters: Record<string, unknown>[] = [];

  if (appName !== null) {
    filters.push({ appName: { eq: appName } });
  }

  if (search !== null) {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;

    filters.push({
      or: [
        { visitorName: { ilike: pattern } },
        { visitorEmail: { ilike: pattern } },
        { shopDomain: { ilike: pattern } },
        { lastMessageExcerpt: { ilike: pattern } },
      ],
    });
  }

  return filters;
};

const combine = (
  filters: Record<string, unknown>[],
): Record<string, unknown> => (filters.length === 0 ? {} : { and: filters });

const countConversations = async (
  client: ApiClient,
  filter: Record<string, unknown>,
): Promise<number> => {
  const result = await client.query({
    crispConversations: { __args: { filter, first: 1 }, totalCount: true },
  });

  return result?.crispConversations?.totalCount ?? 0;
};

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const handler = async (event: RoutePayload<ConversationsBody>) =>
  runRoute(async (client) => {
    const body = event.body ?? {};
    const tab = TABS.includes(body.tab as SupportInboxTab)
      ? (body.tab as SupportInboxTab)
      : 'waiting';
    const scope = buildScopeFilter({
      appName: readText(body.appName),
      search: readText(body.search),
    });
    const after = readText(body.after);
    const settings = readCrispSettings();

    // The oldest wait first: that customer has been ignored the longest.
    const orderBy =
      tab === 'waiting'
        ? [{ waitingSince: 'AscNullsLast' }]
        : [{ lastMessageAt: 'DescNullsLast' }];

    const [page, countValues, syncState] = await Promise.all([
      client.query({
        crispConversations: {
          __args: {
            filter: combine([...scope, buildTabFilter(tab)]),
            first: SUPPORT_INBOX_CONVERSATION_PAGE_SIZE,
            orderBy,
            ...(after === null ? {} : { after }),
          },
          edges: { node: SUPPORT_INBOX_CONVERSATION_SELECTION },
          pageInfo: { endCursor: true, hasNextPage: true },
        },
      }),
      Promise.all(
        TABS.map((countedTab) =>
          countConversations(
            client,
            combine([...scope, buildTabFilter(countedTab)]),
          ),
        ),
      ),
      readCrispSyncState(),
    ]);

    const counts = Object.fromEntries(
      TABS.map((countedTab, index) => [countedTab, countValues[index]]),
    ) as SupportInboxCounts;

    return {
      conversations: (page?.crispConversations?.edges ?? []).map(
        (edge: { node: Record<string, unknown> }) =>
          toSupportInboxConversation(edge.node),
      ),
      endCursor: page?.crispConversations?.pageInfo?.endCursor ?? null,
      hasNextPage: page?.crispConversations?.pageInfo?.hasNextPage === true,
      counts,
      appNames: settings.websites.map((website) => website.appName),
      sync: {
        ...syncState,
        isConfigured: isCrispApiConfigured(settings),
      },
    };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_CONVERSATIONS_LOGIC_FUNCTION_UID,
  name: 'support-inbox-conversations',
  description:
    'Route: one page of Crisp conversations for the support inbox, with tab counts.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_CONVERSATIONS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
