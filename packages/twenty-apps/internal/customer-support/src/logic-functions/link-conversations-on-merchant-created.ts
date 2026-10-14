import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { LINK_CONVERSATIONS_ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { createAppClient } from './utils/create-app-client.util';
import { executeWithRetry } from './utils/execute-with-retry.util';

type CreatedMerchant = {
  id: string;
  appId?: string | null;
  name?: string | null;
  email?: { primaryEmail?: string | null } | null;
};

const readAppName = async (
  client: ApiClient,
  appId: string,
): Promise<string | null> => {
  const result = await executeWithRetry<{
    apps?: { edges?: { node: { name?: string | null } }[] };
  }>(() =>
    client.query({
      apps: {
        __args: { filter: { id: { eq: appId } }, first: 1 },
        edges: { node: { name: true } },
      },
    }),
  );

  return result?.apps?.edges?.[0]?.node?.name ?? null;
};

// Chats often start before the merchant row exists (a shop asks for help
// mid-install, or the app's CRM sync runs later). The hourly catch-up only
// re-reads chats with new activity, so a quiet chat would stay unlinked
// forever without this. Only chats about the merchant's own product are
// taken: the same shop has a row per product.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<CreatedMerchant>>,
) => {
  const merchant = event.properties.after;

  if (typeof merchant.appId !== 'string' || merchant.appId.length === 0) {
    return { linked: 0 };
  }
  const shopDomain = merchant.name?.trim().toLowerCase() ?? '';
  const email = merchant.email?.primaryEmail?.trim().toLowerCase() ?? '';
  const matchers: Record<string, unknown>[] = [];

  if (shopDomain.length > 0) {
    matchers.push({ shopDomain: { eq: shopDomain } });
  }

  if (email.length > 0) {
    matchers.push({ visitorEmail: { eq: email } });
  }

  if (matchers.length === 0) {
    return { linked: 0 };
  }

  const client = createAppClient();
  const appName = await readAppName(client, merchant.appId);

  if (appName === null) {
    return { linked: 0 };
  }

  const result = await executeWithRetry<{
    crispConversations?: { edges?: { node: { id: string } }[] };
  }>(() =>
    client.query({
      crispConversations: {
        __args: {
          filter: {
            and: [
              { merchantId: { is: 'NULL' } },
              { appName: { eq: appName } },
              { or: matchers },
            ],
          },
          first: 200,
        },
        edges: { node: { id: true } },
      },
    }),
  );
  const conversationIds = (result?.crispConversations?.edges ?? []).map(
    (edge) => edge.node.id,
  );

  if (conversationIds.length > 0) {
    await executeWithRetry(() =>
      client.mutation({
        updateCrispConversations: {
          __args: {
            filter: { id: { in: conversationIds } },
            data: { merchantId: merchant.id },
          },
          id: true,
        },
      }),
    );
  }

  return { linked: conversationIds.length };
};

export default defineLogicFunction({
  universalIdentifier:
    LINK_CONVERSATIONS_ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID,
  name: 'link-conversations-on-merchant-created',
  description:
    "Links unmatched Crisp conversations about the merchant's product to it the moment it is created, by shop domain or email.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.created',
  },
  handler,
});
