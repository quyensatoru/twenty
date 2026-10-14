import { type ApiClient } from '../../types/api-client';
import { type CrispMessagePayload } from '../../types/crisp-api';
import { buildCrispExcerpt, mapCrispMessage } from './map-crisp-message.util';
import { listCrispMessages } from './crisp-api.util';
import {
  countConversationMessages,
  upsertMessages,
} from './crisp-conversation-store.util';
import {
  type CrispSettings,
  type CrispWebsite,
} from './read-crisp-settings.util';

// Crisp pages a thread backwards in batches; a support chat past this many
// batches is an outlier and its oldest messages stay in Crisp.
const MAX_MESSAGE_PAGES = 25;

export type ConversationThreadPatch = {
  lastMessageAt?: string;
  lastMessageExcerpt?: string;
  lastMessageFrom?: 'USER' | 'OPERATOR';
  lastMessageFingerprint?: string;
  operatorName?: string;
  messageCount: number;
};

const isThreadMessage = (type: string): boolean =>
  type !== 'note' && type !== 'event';

// Reads the thread from Crisp back to `since` (or to its first message), writes
// every message, and returns the summary the conversation row should show.
export const importConversationMessages = async ({
  client,
  settings,
  website,
  sessionId,
  conversationId,
  since,
}: {
  client: ApiClient;
  settings: CrispSettings;
  website: CrispWebsite;
  sessionId: string;
  conversationId: string;
  since: string | null;
}): Promise<ConversationThreadPatch> => {
  const sinceMs = since === null ? null : new Date(since).getTime();
  const payloads: CrispMessagePayload[] = [];
  let timestampBefore: number | undefined;

  for (let page = 0; page < MAX_MESSAGE_PAGES; page += 1) {
    const batch = await listCrispMessages(
      settings,
      website.websiteId,
      sessionId,
      timestampBefore,
    );
    const timestamps = batch
      .map((message) => message.timestamp)
      .filter(
        (timestamp): timestamp is number => typeof timestamp === 'number',
      );

    payloads.push(...batch);

    if (timestamps.length === 0) {
      break;
    }

    const oldest = Math.min(...timestamps);

    if (oldest === timestampBefore || (sinceMs !== null && oldest <= sinceMs)) {
      break;
    }

    timestampBefore = oldest;
  }

  const recordsById = new Map(
    payloads
      .map((payload) =>
        mapCrispMessage({
          payload,
          websiteId: website.websiteId,
          sessionId,
          conversationId,
        }),
      )
      .filter((record) => record !== undefined)
      .map((record) => [record.id, record]),
  );
  const records = [...recordsById.values()].sort(
    (left, right) =>
      new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  );

  await upsertMessages(client, records);

  const threadMessages = records.filter((record) =>
    isThreadMessage(record.messageType),
  );
  const newest = threadMessages[threadMessages.length - 1];
  const operatorMessages = threadMessages.filter(
    (record) => record.sender === 'OPERATOR',
  );
  const newestOperator = operatorMessages[operatorMessages.length - 1];
  const messageCount = await countConversationMessages(client, conversationId);

  return {
    messageCount,
    ...(newest === undefined
      ? {}
      : {
          lastMessageAt: newest.sentAt,
          lastMessageExcerpt: buildCrispExcerpt(newest.text),
          lastMessageFrom: newest.sender,
          lastMessageFingerprint: newest.fingerprint,
        }),
    ...(newestOperator?.senderName === undefined ||
    newestOperator.senderName === null
      ? {}
      : { operatorName: newestOperator.senderName }),
  };
};
