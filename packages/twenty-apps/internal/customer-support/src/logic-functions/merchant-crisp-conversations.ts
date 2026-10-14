import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { MERCHANT_CRISP_CONVERSATIONS_ROUTE_PATH } from '../constants/crisp';
import { MERCHANT_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { runRoute } from './utils/run-route.util';
import {
  SUPPORT_INBOX_CONVERSATION_SELECTION,
  toSupportInboxConversation,
} from './utils/support-inbox-selection.util';

type MerchantConversationsBody = {
  merchantId?: string;
};

const MAX_CONVERSATIONS = 50;

// The merchant preview in task-manager's issue modal reads a shop's chats
// through here, like the issue panel does with issue-crisp-conversations.
const handler = async (event: RoutePayload<MerchantConversationsBody>) =>
  runRoute(async (client) => {
    const merchantId = event.body?.merchantId;

    if (typeof merchantId !== 'string' || merchantId.length === 0) {
      throw new Error('Missing merchant.');
    }

    const result = await executeWithRetry<{
      crispConversations?: {
        edges?: { node: Record<string, unknown> }[];
      };
    }>(() =>
      client.query({
        crispConversations: {
          __args: {
            filter: { merchantId: { eq: merchantId } },
            first: MAX_CONVERSATIONS,
            orderBy: [{ lastMessageAt: 'DescNullsLast' }],
          },
          edges: { node: SUPPORT_INBOX_CONVERSATION_SELECTION },
        },
      }),
    );

    return {
      conversations: (result?.crispConversations?.edges ?? [])
        .map((edge) => edge.node)
        .filter((conversation) => typeof conversation?.id === 'string')
        .map(toSupportInboxConversation),
    };
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID,
  name: 'merchant-crisp-conversations',
  description:
    "Route: a merchant's Crisp conversations, newest first, for the issue modal's merchant preview.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: MERCHANT_CRISP_CONVERSATIONS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
