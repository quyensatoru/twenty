import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SUPPORT_INBOX_SEARCH_ISSUES_ROUTE_PATH } from '../constants/crisp';
import { SUPPORT_INBOX_SEARCH_ISSUES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import {
  SUPPORT_INBOX_ISSUE_SELECTION,
  toSupportInboxIssue,
} from './utils/conversation-issues.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { runRoute } from './utils/run-route.util';

type SearchIssuesBody = {
  search?: string;
  appName?: string | null;
};

const RESULT_LIMIT = 8;

const readAppId = async (
  client: ApiClient,
  appName: string,
): Promise<string | null> => {
  const result = await executeWithRetry<{
    apps?: { edges?: { node: { id: string } }[] };
  }>(() =>
    client.query({
      apps: {
        __args: { filter: { name: { eq: appName } }, first: 1 },
        edges: { node: { id: true } },
      },
    }),
  );

  return result?.apps?.edges?.[0]?.node?.id ?? null;
};

// Narrowed to the chat's own product: a BLOY chat is about BLOY issues, and
// the runtime role reads past the member's app-scope, so this also keeps the
// picker from listing other teams' work.
const handler = async (event: RoutePayload<SearchIssuesBody>) =>
  runRoute(async (client) => {
    const search = (event.body?.search ?? '').trim();
    const appName = event.body?.appName;
    const appId =
      typeof appName === 'string' && appName.length > 0
        ? await readAppId(client, appName)
        : null;
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const filters: Record<string, unknown>[] = [];

    if (appId !== null) {
      filters.push({ appId: { eq: appId } });
    }

    if (search.length > 0) {
      filters.push({
        or: [{ title: { ilike: pattern } }, { issueKey: { ilike: pattern } }],
      });
    }

    const result = await executeWithRetry<{
      issues?: {
        edges?: { node: Parameters<typeof toSupportInboxIssue>[0] }[];
      };
    }>(() =>
      client.query({
        issues: {
          __args: {
            filter: filters.length === 0 ? {} : { and: filters },
            first: RESULT_LIMIT,
            orderBy: [{ updatedAt: 'DescNullsLast' }],
          },
          edges: { node: SUPPORT_INBOX_ISSUE_SELECTION },
        },
      }),
    );

    return {
      issues: (result?.issues?.edges ?? []).map((edge) =>
        toSupportInboxIssue(edge.node),
      ),
    };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_SEARCH_ISSUES_LOGIC_FUNCTION_UID,
  name: 'support-inbox-search-issues',
  description:
    'Route: issues matching a title or key, for linking a Crisp conversation to an issue.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_SEARCH_ISSUES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
