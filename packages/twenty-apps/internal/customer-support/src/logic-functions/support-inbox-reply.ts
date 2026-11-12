import { randomInt } from 'node:crypto';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  SUPPORT_INBOX_FILE_ROUTE_PATH,
  SUPPORT_INBOX_REPLY_MAX_FILES,
  SUPPORT_INBOX_REPLY_MAX_LENGTH,
  SUPPORT_INBOX_REPLY_ROUTE_PATH,
} from '../constants/crisp';
import {
  CRISP_CONVERSATION_OBJECT_UID,
  SUPPORT_INBOX_REPLY_LOGIC_FUNCTION_UID,
} from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type SupportInboxMessage } from '../types/support-inbox';
import { applyMessageToConversation } from './utils/apply-message-to-conversation.util';
import { sendCrispOperatorMessage } from './utils/crisp-api.util';
import {
  countConversationMessages,
  softDeleteRecord,
  updateConversation,
  upsertMessages,
} from './utils/crisp-conversation-store.util';
import {
  type CrispMessageRecord,
  mapCrispMessage,
} from './utils/map-crisp-message.util';
import {
  type CrispSettings,
  findCrispWebsite,
  isCrispApiConfigured,
  readCrispSettings,
} from './utils/read-crisp-settings.util';
import { readErrorMessage } from './utils/read-error-message.util';
import { resolveMemberAccess } from './utils/resolve-member-access.util';
import { runRoute } from './utils/run-route.util';

type ReplyFile = { fileId: string; name: string };

type ReplyBody = {
  conversationId?: string;
  text?: string;
  files?: unknown;
};

type ReplyConversation = {
  id: string;
  websiteId: string | null;
  sessionId: string | null;
  status: string | null;
  lastMessageAt: string | null;
  waitingSince: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_NAME_LENGTH = 255;
// The link opens a CRM page that forwards to the file, which Crisp cannot
// preview inline, so even images go out as a plain file card.
const SENT_FILE_MIME_TYPE = 'application/octet-stream';

// Set by the CRM rather than Crisp so the message is stored under the same id
// the web hook computes when Crisp echoes it back, and never twice.
const createFingerprint = (): number => Date.now() * 1000 + randomInt(1000);

const readFiles = (value: unknown): ReplyFile[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('Attachments are not in the expected shape.');
  }

  return value.map((file) => {
    const fileId = (file as { fileId?: unknown })?.fileId;
    const name = (file as { name?: unknown })?.name;

    if (
      typeof fileId !== 'string' ||
      !UUID_PATTERN.test(fileId) ||
      typeof name !== 'string' ||
      name.trim().length === 0
    ) {
      throw new Error('Attachments are not in the expected shape.');
    }

    return { fileId, name: name.trim().slice(0, MAX_FILE_NAME_LENGTH) };
  });
};

const buildFileUrl = (messageId: string, fileId: string): string => {
  const serverUrl = (process.env.TWENTY_API_URL ?? '').replace(/\/+$/, '');

  if (serverUrl.length === 0) {
    throw new Error('The CRM address is unknown, so files cannot be shared.');
  }

  return `${serverUrl}/s${SUPPORT_INBOX_FILE_ROUTE_PATH}?m=${messageId}&f=${fileId}`;
};

const toSupportInboxMessage = (
  message: CrispMessageRecord,
): SupportInboxMessage => ({
  id: message.id,
  text: message.text,
  sender: message.sender,
  senderName: message.senderName,
  messageType: message.messageType,
  sentAt: message.sentAt,
  content: message.content,
});

const handler = async (event: RoutePayload<ReplyBody>) =>
  runRoute(async (client) => {
    const conversationId = event.body?.conversationId;
    const text =
      typeof event.body?.text === 'string' ? event.body.text.trim() : '';
    const files = readFiles(event.body?.files);

    if (typeof conversationId !== 'string' || conversationId.length === 0) {
      throw new Error('Missing conversation.');
    }

    if (text.length === 0 && files.length === 0) {
      throw new Error('Write a message first.');
    }

    if (text.length > SUPPORT_INBOX_REPLY_MAX_LENGTH) {
      throw new Error('This message is too long to send.');
    }

    if (files.length > SUPPORT_INBOX_REPLY_MAX_FILES) {
      throw new Error(
        `Send at most ${SUPPORT_INBOX_REPLY_MAX_FILES} files at once.`,
      );
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

    const sender = {
      client,
      settings,
      websiteId: website.websiteId,
      sessionId,
      conversationId,
      nickname: access.name,
    };
    const sent: CrispMessageRecord[] = [];
    const failedFileIds: string[] = [];
    let failure: string | null = null;

    if (text.length > 0) {
      sent.push(await sendText(sender, text));
    }

    for (const file of files) {
      try {
        sent.push(await sendFile(sender, file));
      } catch (error) {
        failedFileIds.push(file.fileId);
        failure ??= `${file.name}: ${readErrorMessage(error)}`;
      }
    }

    if (sent.length === 0) {
      throw new Error(failure ?? 'Nothing was sent.');
    }

    let state: ReplyConversation = conversation;
    let patch = {};

    for (const message of sent) {
      const messagePatch = applyMessageToConversation(state, message);

      patch = { ...patch, ...messagePatch };
      state = { ...state, ...messagePatch };
    }

    await updateConversation(client, conversationId, {
      ...patch,
      messageCount: await countConversationMessages(client, conversationId),
    });

    return {
      messages: sent.map(toSupportInboxMessage),
      failedFileIds,
      failure,
    };
  });

type MessageSender = {
  client: ApiClient;
  settings: CrispSettings;
  websiteId: string;
  sessionId: string;
  conversationId: string;
  nickname: string | null;
};

const buildRecord = (
  sender: MessageSender,
  {
    fingerprint,
    type,
    content,
  }: { fingerprint: number; type: 'text' | 'file'; content: unknown },
): CrispMessageRecord => {
  const message = mapCrispMessage({
    payload: {
      fingerprint,
      from: 'operator',
      type,
      content,
      timestamp: Date.now(),
      user:
        sender.nickname === null ? undefined : { nickname: sender.nickname },
    },
    websiteId: sender.websiteId,
    sessionId: sender.sessionId,
    conversationId: sender.conversationId,
  });

  if (message === undefined) {
    throw new Error('The reply was sent but could not be stored.');
  }

  return message;
};

const sendText = async (
  sender: MessageSender,
  text: string,
): Promise<CrispMessageRecord> => {
  const fingerprint = createFingerprint();

  await sendCrispOperatorMessage(
    sender.settings,
    sender.websiteId,
    sender.sessionId,
    { type: 'text', content: text, fingerprint, nickname: sender.nickname },
  );

  const message = buildRecord(sender, {
    fingerprint,
    type: 'text',
    content: text,
  });

  await upsertMessages(sender.client, [message]);

  return message;
};

// Stored before Crisp gets the link, so the customer never opens it ahead of
// the record that resolves it.
const sendFile = async (
  sender: MessageSender,
  file: ReplyFile,
): Promise<CrispMessageRecord> => {
  const fingerprint = createFingerprint();
  const draft = buildRecord(sender, {
    fingerprint,
    type: 'file',
    content: { name: file.name },
  });
  const content = {
    name: file.name,
    url: buildFileUrl(draft.id, file.fileId),
    type: SENT_FILE_MIME_TYPE,
  };
  const message = { ...draft, content };

  await sender.client.mutation({
    createCrispMessages: {
      __args: {
        data: [
          { ...message, files: [{ fileId: file.fileId, label: file.name }] },
        ],
        upsert: true,
      },
      id: true,
    },
  });

  try {
    await sendCrispOperatorMessage(
      sender.settings,
      sender.websiteId,
      sender.sessionId,
      { type: 'file', content, fingerprint, nickname: sender.nickname },
    );
  } catch (error) {
    await softDeleteRecord(sender.client, 'deleteCrispMessage', message.id);

    throw error;
  }

  return message;
};

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_REPLY_LOGIC_FUNCTION_UID,
  name: 'support-inbox-reply',
  description:
    'Route: sends a support reply (text and files) into a Crisp chat for members whose role may edit Crisp Conversations, and stores it in the thread.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_REPLY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
