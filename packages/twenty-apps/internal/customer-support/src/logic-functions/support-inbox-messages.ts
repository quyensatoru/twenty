import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  SUPPORT_INBOX_MESSAGE_PAGE_SIZE,
  SUPPORT_INBOX_MESSAGES_ROUTE_PATH,
} from '../constants/crisp';
import { SUPPORT_INBOX_MESSAGES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type SupportInboxMessage } from '../types/support-inbox';
import { readConversationIssues } from './utils/conversation-issues.util';
import { runRoute } from './utils/run-route.util';
import {
  SUPPORT_INBOX_CONVERSATION_SELECTION,
  SUPPORT_INBOX_MESSAGE_SELECTION,
  toSupportInboxConversation,
} from './utils/support-inbox-selection.util';

type MessagesBody = {
  conversationId?: string;
  before?: string | null;
};

const handler = async (event: RoutePayload<MessagesBody>) =>
  runRoute(async (client) => {
    const conversationId = event.body?.conversationId;

    if (typeof conversationId !== 'string' || conversationId.length === 0) {
      throw new Error('Missing conversation.');
    }

    const before = event.body?.before;
    const [conversationResult, messageResult, issues] = await Promise.all([
      client.query({
        crispConversations: {
          __args: { filter: { id: { eq: conversationId } }, first: 1 },
          edges: { node: SUPPORT_INBOX_CONVERSATION_SELECTION },
        },
      }),
      client.query({
        crispMessages: {
          __args: {
            filter: {
              conversationId: { eq: conversationId },
              ...(typeof before === 'string' && before.length > 0
                ? { sentAt: { lt: before } }
                : {}),
            },
            first: SUPPORT_INBOX_MESSAGE_PAGE_SIZE,
            orderBy: [{ sentAt: 'DescNullsLast' }],
          },
          edges: { node: SUPPORT_INBOX_MESSAGE_SELECTION },
          pageInfo: { hasNextPage: true },
        },
      }),
      readConversationIssues(client, conversationId),
    ]);

    const conversationNode =
      conversationResult?.crispConversations?.edges?.[0]?.node;

    if (conversationNode === undefined) {
      throw new Error('This conversation no longer exists.');
    }

    const messages: SupportInboxMessage[] = (
      messageResult?.crispMessages?.edges ?? []
    )
      .map((edge: { node: SupportInboxMessage }) => edge.node)
      .reverse();

    return {
      conversation: toSupportInboxConversation(conversationNode),
      messages,
      hasOlder: messageResult?.crispMessages?.pageInfo?.hasNextPage === true,
      issues,
    };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_MESSAGES_LOGIC_FUNCTION_UID,
  name: 'support-inbox-messages',
  description:
    'Route: one conversation with its latest messages, oldest first, and the issues linked to it.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_MESSAGES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
