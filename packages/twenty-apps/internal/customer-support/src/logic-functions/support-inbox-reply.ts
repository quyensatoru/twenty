import { randomInt } from 'node:crypto';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  SUPPORT_INBOX_REPLY_MAX_LENGTH,
  SUPPORT_INBOX_REPLY_ROUTE_PATH,
} from '../constants/crisp';
import {
  CRISP_CONVERSATION_OBJECT_UID,
  SUPPORT_INBOX_REPLY_LOGIC_FUNCTION_UID,
} from '../constants/universal-identifiers';
import { applyMessageToConversation } from './utils/apply-message-to-conversation.util';
import { sendCrispOperatorMessage } from './utils/crisp-api.util';
import {
  countConversationMessages,
  updateConversation,
  upsertMessages,
} from './utils/crisp-conversation-store.util';
import { mapCrispMessage } from './utils/map-crisp-message.util';
import {
  findCrispWebsite,
  isCrispApiConfigured,
  readCrispSettings,
} from './utils/read-crisp-settings.util';
import { resolveMemberAccess } from './utils/resolve-member-access.util';
import { runRoute } from './utils/run-route.util';

type ReplyBody = {
  conversationId?: string;
  text?: string;
};

type ReplyConversation = {
  id: string;
  websiteId: string | null;
  sessionId: string | null;
  status: string | null;
  lastMessageAt: string | null;
  waitingSince: string | null;
};

// Set by the CRM rather than Crisp so the message is stored under the same id
// the web hook computes when Crisp echoes it back, and never twice.
const createFingerprint = (): number => Date.now() * 1000 + randomInt(1000);

const handler = async (event: RoutePayload<ReplyBody>) =>
  runRoute(async (client) => {
    const conversationId = event.body?.conversationId;
    const text =
      typeof event.body?.text === 'string' ? event.body.text.trim() : '';

    if (typeof conversationId !== 'string' || conversationId.length === 0) {
      throw new Error('Missing conversation.');
    }

    if (text.length === 0) {
      throw new Error('Write a message first.');
    }

    if (text.length > SUPPORT_INBOX_REPLY_MAX_LENGTH) {
      throw new Error('This message is too long to send.');
    }

    const access = await resolveMemberAccess(CRISP_CONVERSATION_OBJECT_UID);

    if (!access.canUpdate) {
      throw new Error(
        'Your role can only read chats. Ask an admin to give it edit access to Crisp Conversations to reply.',
      );
    }

    const settings = readCrispSettings();

    if (!isCrispApiConfigured(settings)) {
      throw new Error('Crisp is not connected, so replies cannot be sent.');
    }

    const result = await client.query({
      crispConversations: {
        __args: { filter: { id: { eq: conversationId } }, first: 1 },
        edges: {
          node: {
            id: true,
            websiteId: true,
            sessionId: true,
            status: true,
            lastMessageAt: true,
            waitingSince: true,
          },
        },
      },
    });
    const conversation = result?.crispConversations?.edges?.[0]?.node as
      ReplyConversation | undefined;

    if (conversation === undefined) {
      throw new Error('This conversation no longer exists.');
    }

    const website = findCrispWebsite(
      settings,
      conversation.websiteId ?? undefined,
    );
    const sessionId = conversation.sessionId ?? '';

    if (website === undefined || sessionId.length === 0) {
      throw new Error(
        'This chat belongs to a Crisp website the CRM is not connected to.',
      );
    }

    const fingerprint = createFingerprint();

    await sendCrispOperatorMessage(settings, website.websiteId, sessionId, {
      text,
      fingerprint,
      nickname: access.name,
    });

    const message = mapCrispMessage({
      payload: {
        fingerprint,
        from: 'operator',
        type: 'text',
        content: text,
        timestamp: Date.now(),
        user: access.name === null ? undefined : { nickname: access.name },
      },
      websiteId: website.websiteId,
      sessionId,
      conversationId,
    });

    if (message === undefined) {
      throw new Error('The reply was sent but could not be stored.');
    }

    await upsertMessages(client, [message]);
    await updateConversation(client, conversationId, {
      ...applyMessageToConversation(conversation, message),
      messageCount: await countConversationMessages(client, conversationId),
    });

    return {
      message: {
        id: message.id,
        text: message.text,
        sender: message.sender,
        senderName: message.senderName,
        messageType: message.messageType,
        sentAt: message.sentAt,
        content: message.content,
      },
    };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_REPLY_LOGIC_FUNCTION_UID,
  name: 'support-inbox-reply',
  description:
    'Route: sends a support reply into a Crisp chat for members whose role may edit Crisp Conversations, and stores it in the thread.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_REPLY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
