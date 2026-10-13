import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_CRISP_CONVERSATIONS_ROUTE_PATH } from '../constants/crisp';
import { ISSUE_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { runRoute } from './utils/run-route.util';
import {
  SUPPORT_INBOX_CONVERSATION_SELECTION,
  toSupportInboxConversation,
} from './utils/support-inbox-selection.util';

type IssueConversationsBody = {
  issueId?: string;
};

const MAX_CONVERSATIONS = 50;

// The issue side of the link, served from here so task-manager reads chats
// without its own role needing access to this app's objects.
const handler = async (event: RoutePayload<IssueConversationsBody>) =>
  runRoute(async (client) => {
    const issueId = event.body?.issueId;

    if (typeof issueId !== 'string' || issueId.length === 0) {
      throw new Error('Missing issue.');
    }

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

    return {
      conversations: (result?.crispConversationIssues?.edges ?? [])
        .map((edge) => edge.node.conversation)
        .filter(
          (conversation): conversation is Record<string, unknown> =>
            typeof conversation?.id === 'string',
        )
        .map(toSupportInboxConversation),
    };
  });

export default defineLogicFunction({
  universalIdentifier: ISSUE_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID,
  name: 'issue-crisp-conversations',
  description:
    'Route: the Crisp conversations linked to one issue, for the issue details panel.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ISSUE_CRISP_CONVERSATIONS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
