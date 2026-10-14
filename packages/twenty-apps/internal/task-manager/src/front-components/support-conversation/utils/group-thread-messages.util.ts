import { type SupportInboxMessage } from '../types/support-inbox';
import { readDayKey } from './format-inbox-time.util';

// Consecutive messages from the same side within this window read as one
// burst and share a single name and timestamp, as in any chat app.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type ThreadMessageGroup = {
  key: string;
  kind: 'customer' | 'support' | 'note' | 'event';
  senderName: string | null;
  messages: SupportInboxMessage[];
};

export type ThreadDay = {
  key: string;
  firstSentAt: string | null;
  groups: ThreadMessageGroup[];
};

const readKind = (message: SupportInboxMessage): ThreadMessageGroup['kind'] => {
  if (message.messageType === 'note') {
    return 'note';
  }

  if (message.messageType === 'event') {
    return 'event';
  }

  return message.sender === 'OPERATOR' ? 'support' : 'customer';
};

const readTime = (message: SupportInboxMessage): number =>
  message.sentAt === null ? 0 : new Date(message.sentAt).getTime();

export const groupThreadMessages = (
  messages: SupportInboxMessage[],
): ThreadDay[] => {
  const days: ThreadDay[] = [];

  for (const message of messages) {
    const dayKey = readDayKey(message.sentAt);
    let day = days[days.length - 1];

    if (day === undefined || day.key !== dayKey) {
      day = { key: dayKey, firstSentAt: message.sentAt, groups: [] };
      days.push(day);
    }

    const kind = readKind(message);
    const group = day.groups[day.groups.length - 1];
    const previous = group?.messages[group.messages.length - 1];

    if (
      group !== undefined &&
      previous !== undefined &&
      group.kind === kind &&
      kind !== 'event' &&
      group.senderName === message.senderName &&
      readTime(message) - readTime(previous) <= GROUP_WINDOW_MS
    ) {
      group.messages.push(message);
      continue;
    }

    day.groups.push({
      key: message.id,
      kind,
      senderName: message.senderName,
      messages: [message],
    });
  }

  return days;
};
