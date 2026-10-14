import { defineLogicFunction } from 'twenty-sdk/define';

import { RELINK_CRISP_CONVERSATION_MERCHANTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type CrispConversationMeta } from '../types/crisp-api';
import { createAppClient } from './utils/create-app-client.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import {
  findCrispWebsite,
  readCrispSettings,
} from './utils/read-crisp-settings.util';
import { resolveConversationAppName } from './utils/resolve-conversation-app-name.util';
import { resolveConversationMerchant } from './utils/resolve-conversation-merchant.util';

type RelinkPayload = {
  after?: string | null;
};

type StoredConversationRow = {
  id: string;
  websiteId: string | null;
  appName: string | null;
  merchantId: string | null;
  shopDomain: string | null;
  visitorName: string | null;
  visitorEmail: string | null;
  segments: string[] | null;
  sessionData: Record<string, unknown> | null;
};

const PAGE_SIZE = 100;
// Leaves room under the timeout to finish the page in flight.
const RUN_BUDGET_MS = 480_000;

const readText = (value: string | null): string | undefined =>
  value === null || value === '' ? undefined : value;

// Applies the product and merchant rules to chats stored before them, from
// what each session already holds, so Crisp is not called. Run it again with
// the returned cursor until `hasNextPage` is false.
const handler = async (payload: RelinkPayload) => {
  const client = createAppClient();
  const settings = readCrispSettings();
  const deadline = Date.now() + RUN_BUDGET_MS;
  let after = payload?.after ?? null;
  let processed = 0;
  let updated = 0;

  for (;;) {
    const result = await executeWithRetry<{
      crispConversations?: {
        edges?: { node: StoredConversationRow }[];
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      };
    }>(() =>
      client.query({
        crispConversations: {
          __args: {
            first: PAGE_SIZE,
            orderBy: [{ id: 'AscNullsLast' }],
            ...(after === null ? {} : { after }),
          },
          edges: {
            node: {
              id: true,
              websiteId: true,
              appName: true,
              merchantId: true,
              shopDomain: true,
              visitorName: true,
              visitorEmail: true,
              segments: true,
              sessionData: true,
            },
          },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );
    const connection = result?.crispConversations;

    for (const { node: conversation } of connection?.edges ?? []) {
      processed += 1;

      // A chat from a website no longer configured keeps whatever it has.
      const website = findCrispWebsite(
        settings,
        conversation.websiteId ?? undefined,
      );

      if (website === undefined) {
        continue;
      }

      const appName = resolveConversationAppName(
        website.appName,
        conversation.sessionData,
      );
      const meta: CrispConversationMeta = {
        nickname: readText(conversation.visitorName),
        email: readText(conversation.visitorEmail),
        segments: conversation.segments ?? undefined,
        data:
          (conversation.sessionData as CrispConversationMeta['data']) ??
          undefined,
      };
      const merchantFields = await resolveConversationMerchant({
        client,
        appName,
        meta,
      });
      const shopDomain = merchantFields.shopDomain ?? conversation.shopDomain;

      if (
        appName === conversation.appName &&
        merchantFields.merchantId === conversation.merchantId &&
        shopDomain === conversation.shopDomain
      ) {
        continue;
      }

      await executeWithRetry(() =>
        client.mutation({
          updateCrispConversation: {
            __args: {
              id: conversation.id,
              data: { appName, ...merchantFields },
            },
            id: true,
          },
        }),
      );
      updated += 1;
    }

    after = connection?.pageInfo?.endCursor ?? null;

    const hasNextPage = connection?.pageInfo?.hasNextPage === true;

    if (!hasNextPage || after === null || Date.now() > deadline) {
      return { processed, updated, hasNextPage, after };
    }
  }
};

export default defineLogicFunction({
  universalIdentifier: RELINK_CRISP_CONVERSATION_MERCHANTS_LOGIC_FUNCTION_UID,
  name: 'relink-crisp-conversation-merchants',
  description:
    'One-off: re-applies the product and merchant matching to every stored Crisp conversation, resuming from a cursor.',
  timeoutSeconds: 600,
  handler,
});
