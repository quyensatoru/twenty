import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_CRISP_CONVERSATIONS_ROUTE_PATH } from '../constants/crisp';
import { ISSUE_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { mergeIssueConversations } from './utils/merge-issue-conversations.util';
import { runRoute } from './utils/run-route.util';
import {
  SUPPORT_INBOX_CONVERSATION_SELECTION,
  toSupportInboxConversation,
} from './utils/support-inbox-selection.util';

type IssueConversationsBody = {
  issueId?: string;
};

const MAX_CONVERSATIONS = 50;
const MAX_ISSUE_MERCHANTS = 50;

type ConversationNode = Record<string, unknown> & { id: string };

const isConversationNode = (
  conversation: Record<string, unknown> | null | undefined,
): conversation is ConversationNode => typeof conversation?.id === 'string';

const readLinkedConversations = async (
  client: ApiClient,
  issueId: string,
): Promise<ConversationNode[]> => {
  const result = await executeWithRetry<{
    crispConversationIssues?: {
      edges?: { node: { conversation?: Record<string, unknown> | null } }[];
    };
  }>(() =>
    client.query({
      crispConversationIssues: {
        __args: {
          filter: { issueId: { eq: issueId } },
          first: MAX_CONVERSATIONS,
          orderBy: [{ createdAt: 'AscNullsLast' }],
        },
        edges: {
          node: { conversation: SUPPORT_INBOX_CONVERSATION_SELECTION },
        },
      },
    }),
  );

  return (result?.crispConversationIssues?.edges ?? [])
    .map((edge) => edge.node.conversation)
    .filter(isConversationNode);
};

// Each merchant row is one shop on one product, so its chats are already the
// right product's: the sync links a chat by shop domain and product.
const readMerchantConversations = async (
  client: ApiClient,
  issueId: string,
): Promise<ConversationNode[]> => {
  const merchantsResult = await executeWithRetry<{
    issueMerchants?: { edges?: { node: { merchantId?: string | null } }[] };
  }>(() =>
    client.query({
      issueMerchants: {
        __args: {
          filter: { issueId: { eq: issueId } },
          first: MAX_ISSUE_MERCHANTS,
        },
        edges: { node: { merchantId: true } },
      },
    }),
  );
  const merchantIds = (merchantsResult?.issueMerchants?.edges ?? [])
    .map((edge) => edge.node.merchantId)
    .filter(
      (merchantId): merchantId is string =>
        typeof merchantId === 'string' && merchantId.length > 0,
    );

  if (merchantIds.length === 0) {
    return [];
  }

  const result = await executeWithRetry<{
    crispConversations?: { edges?: { node: Record<string, unknown> }[] };
  }>(() =>
    client.query({
      crispConversations: {
        __args: {
          filter: { merchantId: { in: merchantIds } },
          first: MAX_CONVERSATIONS,
          orderBy: [{ lastMessageAt: 'DescNullsLast' }],
        },
        edges: { node: SUPPORT_INBOX_CONVERSATION_SELECTION },
      },
    }),
  );

  return (result?.crispConversations?.edges ?? [])
    .map((edge) => edge.node)
    .filter(isConversationNode);
};

// The issue side of the link, served from here so task-manager reads chats
// without its own role needing access to this app's objects.
const handler = async (event: RoutePayload<IssueConversationsBody>) =>
  runRoute(async (client) => {
    const issueId = event.body?.issueId;

    if (typeof issueId !== 'string' || issueId.length === 0) {
      throw new Error('Missing issue.');
    }

    const [linkedConversations, merchantConversations] = await Promise.all([
      readLinkedConversations(client, issueId),
      readMerchantConversations(client, issueId),
    ]);

    return {
      conversations: mergeIssueConversations(
        linkedConversations,
        merchantConversations,
      ).map(toSupportInboxConversation),
    };
  });

export default defineLogicFunction({
  universalIdentifier: ISSUE_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID,
  name: 'issue-crisp-conversations',
  description:
    "Route: the Crisp conversations of an issue's merchants and the ones linked to it, for the issue details panel.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ISSUE_CRISP_CONVERSATIONS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
