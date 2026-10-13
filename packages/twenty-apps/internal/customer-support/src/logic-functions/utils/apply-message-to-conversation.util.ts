import { type CrispMessageSender } from '../../constants/crisp';
import { buildCrispExcerpt } from './map-crisp-message.util';

export type ConversationThreadState = {
  status: string | null;
  lastMessageAt: string | null;
  waitingSince: string | null;
};

export type ConversationMessagePatch = {
  lastMessageAt?: string;
  lastMessageExcerpt?: string;
  lastMessageFrom?: CrispMessageSender;
  lastMessageFingerprint?: string;
  waitingSince?: string | null;
  operatorName?: string;
  status?: 'UNRESOLVED';
};

const isAtOrAfter = (left: string, right: string | null): boolean =>
  right === null || new Date(left).getTime() >= new Date(right).getTime();

// Internal notes are support talking to itself: they neither answer the
// customer nor count as the latest message of the chat.
const isConversationMessage = (messageType: string): boolean =>
  messageType !== 'note' && messageType !== 'event';

// How one new message moves the conversation summary. Deliveries can arrive
// out of order, so the summary only moves forward in time.
export const applyMessageToConversation = (
  current: ConversationThreadState,
  message: {
    sender: CrispMessageSender;
    senderName: string | null;
    messageType: string;
    text: string;
    fingerprint: string;
    sentAt: string;
  },
): ConversationMessagePatch => {
  if (!isConversationMessage(message.messageType)) {
    return {};
  }

  const patch: ConversationMessagePatch = {};

  if (isAtOrAfter(message.sentAt, current.lastMessageAt)) {
    patch.lastMessageAt = message.sentAt;
    patch.lastMessageExcerpt = buildCrispExcerpt(message.text);
    patch.lastMessageFrom = message.sender;
    patch.lastMessageFingerprint = message.fingerprint;
  }

  if (message.sender === 'USER') {
    if (current.waitingSince === null) {
      patch.waitingSince = message.sentAt;
    }

    // Crisp reopens a resolved chat when the customer writes again.
    if (current.status === 'RESOLVED') {
      patch.status = 'UNRESOLVED';
    }

    return patch;
  }

  if (isAtOrAfter(message.sentAt, current.waitingSince)) {
    patch.waitingSince = null;
  }

  if (message.senderName !== null && patch.lastMessageAt !== undefined) {
    patch.operatorName = message.senderName;
  }

  return patch;
};
