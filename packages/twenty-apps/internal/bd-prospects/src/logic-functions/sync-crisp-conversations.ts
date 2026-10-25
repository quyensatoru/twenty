import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';

import { SYNC_CRISP_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createConversationAppClient } from '../utils/create-conversation-app-client';
import { executeWithRetry } from '../utils/execute-with-retry';
import {
  type ProspectConversationClient,
  refreshConversationProspects,
  refreshProspectConversations,
} from '../utils/prospect-conversations';

export type CrispSyncSummary = {
  checked: number;
  linked: number;
  empty: number;
  completed: boolean;
  nextCursor: string | null;
};

type ConversationChangeEvent = {
  recordId: string;
  properties: {
    before?: { merchantId?: string | null } | null;
    after?: { merchantId?: string | null } | null;
  };
};

const BACKFILL_PAGE_SIZE = 200;
const BACKFILL_TIME_BUDGET_MS = 540_000;

type ProspectPage = {
  edges: { node: { id: string }; cursor: string }[];
  pageInfo: { hasNextPage: boolean; endCursor: string };
};

export const syncCrispConversations = async ({
  client,
  prospectId,
  writeLimit = BACKFILL_PAGE_SIZE,
  after,
  shouldStop,
}: {
  client: ProspectConversationClient;
  prospectId?: string;
  writeLimit?: number;
  after?: string;
  shouldStop?: () => boolean;
}): Promise<CrispSyncSummary> => {
  const startedAt = Date.now();
  const isOutOfTime = () =>
    Date.now() - startedAt >= BACKFILL_TIME_BUDGET_MS ||
    shouldStop?.() === true;
  const summary: CrispSyncSummary = {
    checked: 0,
    linked: 0,
    empty: 0,
    completed: false,
    nextCursor: after ?? null,
  };
  let cursor = after;

  while (summary.checked < writeLimit && !isOutOfTime()) {
    const result = (await executeWithRetry(() =>
      client.query({
        prospects: {
          __args: {
            ...(prospectId === undefined
              ? {}
              : { filter: { id: { eq: prospectId } } }),
            first: Math.min(BACKFILL_PAGE_SIZE, writeLimit - summary.checked),
            after: cursor,
            orderBy: [{ id: 'AscNullsLast' }],
          },
          edges: { node: { id: true }, cursor: true },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    )) as { prospects: ProspectPage };

    for (const edge of result.prospects.edges) {
      if (isOutOfTime()) {
        return summary;
      }
      const hasConversations = await refreshProspectConversations(
        client,
        edge.node.id,
      );
      summary.checked += 1;
      summary.linked += hasConversations ? 1 : 0;
      summary.empty += hasConversations ? 0 : 1;
      summary.nextCursor = edge.cursor;
    }

    if (!result.prospects.pageInfo.hasNextPage) {
      return { ...summary, completed: true, nextCursor: null };
    }
    cursor = result.prospects.pageInfo.endCursor;
  }

  return summary;
};

export const refreshProspectOnConversationChanged = async (
  client: ProspectConversationClient,
  events: ConversationChangeEvent[],
) => {
  const merchantIds = events
    .flatMap((event) => [
      event.properties.before?.merchantId,
      event.properties.after?.merchantId,
    ])
    .filter(
      (merchantId): merchantId is string => typeof merchantId === 'string',
    );

  return {
    prospectIds: await refreshConversationProspects(client, merchantIds),
  };
};

type MerchantChangeEvent = {
  recordId: string;
  properties: {
    before?: { prospectId?: string | null } | null;
    after?: { prospectId?: string | null } | null;
  };
};

export const refreshProspectOnMerchantChanged = async (
  client: ProspectConversationClient,
  events: MerchantChangeEvent[],
) => {
  const prospectIds = [
    ...new Set(
      events
        .flatMap((event) => [
          event.properties.before?.prospectId,
          event.properties.after?.prospectId,
        ])
        .filter(
          (prospectId): prospectId is string => typeof prospectId === 'string',
        ),
    ),
  ];

  for (const prospectId of prospectIds) {
    await refreshProspectConversations(client, prospectId);
  }

  return { prospectIds };
};

const handler = (batch: DatabaseEventBatchPayload<ConversationChangeEvent>) =>
  refreshProspectOnConversationChanged(
    createConversationAppClient(),
    batch.events,
  );

export default defineLogicFunction({
  universalIdentifier: SYNC_CRISP_LOGIC_FUNCTION_UID,
  name: 'sync-crisp-conversations',
  description:
    'Updates BD chat links and Email PIC from stored conversations when a conversation changes.',
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'crispConversation.*',
    // lastMessageAt is left out on purpose: every Crisp message rewrites it,
    // and it only reorders the links of an existing prospect.
    updatedFields: ['merchantId', 'visitorName', 'visitorEmail', 'appName'],
    batchMode: true,
  },
  handler,
});
