import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SUPPORT_INBOX_SUMMARIZE_ROUTE_PATH } from '../constants/crisp';
import { SUPPORT_INBOX_SUMMARIZE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { runRoute } from './utils/run-route.util';
import { summarizeConversation } from './utils/summarize-conversation.util';

type SummarizeBody = {
  conversationId?: string;
  language?: string;
};

const handler = async (event: RoutePayload<SummarizeBody>) =>
  runRoute(async (client) => {
    const conversationId = event.body?.conversationId;

    if (typeof conversationId !== 'string' || conversationId.length === 0) {
      throw new Error('Missing conversation.');
    }

    const language = (event.body?.language ?? 'vi').slice(0, 2).toLowerCase();

    return {
      summary: await summarizeConversation({
        client,
        conversationId,
        language,
      }),
    };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_SUMMARIZE_LOGIC_FUNCTION_UID,
  name: 'support-inbox-summarize',
  description:
    "Route: summarizes a Crisp conversation with the workspace's AI model and stores the summary, problem category and next step on it.",
  timeoutSeconds: 90,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_SUMMARIZE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
