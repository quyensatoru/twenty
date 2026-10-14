import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH } from '../constants/crisp';
import { SUPPORT_INBOX_LINK_ISSUE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readConversationIssues } from './utils/conversation-issues.util';
import {
  linkIssuesToConversation,
  unlinkIssueFromConversation,
} from './utils/link-conversation-issues.util';
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

    if (event.body?.isLinked === false) {
      await unlinkIssueFromConversation({ client, conversationId, issueId });
    } else {
      await linkIssuesToConversation({
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
    "Route: links or unlinks an issue on a Crisp conversation, through the chat's merchant when it has one, and returns the linked issues.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
