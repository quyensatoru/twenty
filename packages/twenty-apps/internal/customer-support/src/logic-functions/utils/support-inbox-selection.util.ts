import { type SupportInboxConversation } from '../../types/support-inbox';

export const SUPPORT_INBOX_CONVERSATION_SELECTION = {
  id: true,
  visitorName: true,
  visitorEmail: true,
  status: true,
  appName: true,
  shopDomain: true,
  lastMessageAt: true,
  lastMessageExcerpt: true,
  lastMessageFrom: true,
  waitingSince: true,
  startedAt: true,
  messageCount: true,
  segments: true,
  operatorName: true,
  country: true,
  sessionId: true,
  websiteId: true,
  sessionData: true,
  aiSummary: true,
  aiProblem: true,
  aiNextStep: true,
  aiSummaryAt: true,
  aiSummaryMessageCount: true,
  merchant: { id: true, name: true },
} as const;

export const SUPPORT_INBOX_MESSAGE_SELECTION = {
  id: true,
  text: true,
  sender: true,
  senderName: true,
  messageType: true,
  sentAt: true,
  content: true,
} as const;

// TEXT columns read back as '' when never written, and the inbox treats a
// value as present whenever it is not null.
const TEXT_FIELDS = [
  'visitorName',
  'visitorEmail',
  'appName',
  'shopDomain',
  'lastMessageExcerpt',
  'operatorName',
  'country',
  'sessionId',
  'websiteId',
  'aiSummary',
  'aiProblem',
  'aiNextStep',
] as const;

export const toSupportInboxConversation = (
  node: Record<string, unknown>,
): SupportInboxConversation => {
  const merchant = node.merchant as { id?: string; name?: string } | null;
  const normalizedText = Object.fromEntries(
    TEXT_FIELDS.map((fieldName) => {
      const value = node[fieldName];

      return [
        fieldName,
        typeof value === 'string' && value.trim().length > 0 ? value : null,
      ];
    }),
  );

  return {
    ...(node as Omit<SupportInboxConversation, 'merchant'>),
    ...normalizedText,
    merchant:
      merchant !== null &&
      typeof merchant === 'object' &&
      typeof merchant.id === 'string'
        ? { id: merchant.id, name: merchant.name ?? null }
        : null,
  };
};
