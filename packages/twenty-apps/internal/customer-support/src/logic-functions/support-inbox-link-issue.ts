import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH } from '../constants/crisp';
import { SUPPORT_INBOX_LINK_ISSUE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readConversationIssues } from './utils/conversation-issues.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { linkConversationIssues } from './utils/link-conversation-issues.util';
import { runRoute } from './utils/run-route.util';

type LinkIssueBody = {
  conversationId?: string;
  issueId?: string;
  isLinked?: boolean;
};

const readId = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing ${label}.`);
  }

  return value;
};

const handler = async (event: RoutePayload<LinkIssueBody>) =>
  runRoute(async (client) => {
    const conversationId = readId(event.body?.conversationId, 'conversation');
    const issueId = readId(event.body?.issueId, 'issue');
    const filter = {
      conversationId: { eq: conversationId },
      issueId: { eq: issueId },
    };

    if (event.body?.isLinked === false) {
      await executeWithRetry(() =>
        client.mutation({
          destroyCrispConversationIssues: { __args: { filter }, id: true },
        }),
      );
    } else {
      await linkConversationIssues({
        client,
        conversationId,
        issueIds: [issueId],
      });
    }

    return { issues: await readConversationIssues(client, conversationId) };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_LINK_ISSUE_LOGIC_FUNCTION_UID,
  name: 'support-inbox-link-issue',
  description:
    'Route: links or unlinks an issue on a Crisp conversation and returns the linked issues.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
