export const SUPPORT_INBOX_MESSAGES_ROUTE_PATH =
  '/customer-support/inbox/messages';
export const SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH =
  '/customer-support/inbox/link-issue';
export const SUPPORT_INBOX_SUMMARIZE_ROUTE_PATH =
  '/customer-support/inbox/summarize';
export const SUPPORT_INBOX_SEARCH_ISSUES_ROUTE_PATH =
  '/customer-support/inbox/search-issues';

export type CrispConversationStatus = 'PENDING' | 'UNRESOLVED' | 'RESOLVED';

export type CrispMessageSender = 'USER' | 'OPERATOR';

export const buildCrispConversationUrl = ({
  websiteId,
  sessionId,
}: {
  websiteId: string;
  sessionId: string;
}): string => `https://app.crisp.chat/website/${websiteId}/inbox/${sessionId}/`;
