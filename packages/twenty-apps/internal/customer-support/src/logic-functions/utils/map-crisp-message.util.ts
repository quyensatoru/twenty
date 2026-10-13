import { type CrispMessageSender } from '../../constants/crisp';
import { type CrispMessagePayload } from '../../types/crisp-api';
import { computeCrispMessageId } from './crisp-record-id.util';

export type CrispMessageRecord = {
  id: string;
  conversationId: string;
  fingerprint: string;
  sender: CrispMessageSender;
  senderName: string | null;
  messageType: string;
  text: string;
  content: Record<string, unknown> | null;
  sentAt: string;
};

const EXCERPT_LENGTH = 160;

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;

const readChoiceLabels = (content: Record<string, unknown>): string[] => {
  const choices = Array.isArray(content.choices) ? content.choices : [];

  return choices
    .filter(
      (choice): choice is Record<string, unknown> =>
        typeof choice === 'object' &&
        choice !== null &&
        (choice as Record<string, unknown>).selected === true,
    )
    .map((choice) => readString(choice.label))
    .filter((label): label is string => label !== undefined);
};

// What a person would read in the thread. Structured content keeps its
// original shape in `content`; this is only the searchable, previewable text.
export const readCrispMessageText = (
  type: string | undefined,
  content: unknown,
): string => {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (typeof content !== 'object' || content === null) {
    return '';
  }

  const record = content as Record<string, unknown>;

  switch (type) {
    case 'file':
      return readString(record.name) ?? 'File';
    case 'animation':
      return 'GIF';
    case 'audio':
      return 'Voice message';
    case 'picker': {
      const question = readString(record.text) ?? '';
      const selected = readChoiceLabels(record);

      return selected.length > 0
        ? `${question} → ${selected.join(', ')}`.trim()
        : question;
    }
    case 'field': {
      const question = readString(record.text) ?? '';
      const answer = readString(record.value);

      return answer === undefined ? question : `${question} → ${answer}`.trim();
    }
    case 'carousel':
      return readString(record.text) ?? 'Carousel';
    default:
      return readString(record.text) ?? readString(record.namespace) ?? '';
  }
};

export const buildCrispExcerpt = (text: string): string => {
  const collapsed = text.replace(/\s+/g, ' ').trim();

  return collapsed.length > EXCERPT_LENGTH
    ? `${collapsed.slice(0, EXCERPT_LENGTH - 1)}…`
    : collapsed;
};

export const mapCrispMessage = ({
  payload,
  websiteId,
  sessionId,
  conversationId,
}: {
  payload: CrispMessagePayload;
  websiteId: string;
  sessionId: string;
  conversationId: string;
}): CrispMessageRecord | undefined => {
  const fingerprint =
    payload.fingerprint === undefined ? '' : String(payload.fingerprint);

  if (fingerprint.length === 0) {
    return undefined;
  }

  const timestamp =
    typeof payload.timestamp === 'number' ? payload.timestamp : Date.now();
  const type = payload.type ?? 'text';

  return {
    id: computeCrispMessageId({ websiteId, sessionId, fingerprint }),
    conversationId,
    fingerprint,
    sender: payload.from === 'operator' ? 'OPERATOR' : 'USER',
    senderName: readString(payload.user?.nickname) ?? null,
    messageType: type,
    text: readCrispMessageText(type, payload.content),
    content:
      typeof payload.content === 'object' && payload.content !== null
        ? (payload.content as Record<string, unknown>)
        : null,
    sentAt: new Date(timestamp).toISOString(),
  };
};
