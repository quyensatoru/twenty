export const CRISP_PLUGIN_IDENTIFIER_VARIABLE = 'CRISP_PLUGIN_IDENTIFIER';
export const CRISP_PLUGIN_KEY_VARIABLE = 'CRISP_PLUGIN_KEY';
export const CRISP_WEBHOOK_SECRET_VARIABLE = 'CRISP_WEBHOOK_SECRET';
export const CRISP_SYNC_ENABLED_VARIABLE = 'CRISP_SYNC_ENABLED';

// One Crisp website per product. The key is the `app.name` of the product's
// merchants, so a chat is matched against that product's merchants first.
export const CRISP_WEBSITE_APP_NAMES = ['MIDA', 'BLOY', 'FRAUD', 'EU'] as const;

export type CrispWebsiteAppName = (typeof CRISP_WEBSITE_APP_NAMES)[number];

export const getCrispWebsiteIdVariable = (appName: string): string =>
  `CRISP_WEBSITE_ID_${appName}`;

export const SUPPORT_INBOX_CONVERSATIONS_ROUTE_PATH =
  '/customer-support/inbox/conversations';
export const SUPPORT_INBOX_MESSAGES_ROUTE_PATH =
  '/customer-support/inbox/messages';
export const SUPPORT_INBOX_SYNC_ROUTE_PATH = '/customer-support/inbox/sync';
export const SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH =
  '/customer-support/inbox/link-issue';
export const SUPPORT_INBOX_SUMMARIZE_ROUTE_PATH =
  '/customer-support/inbox/summarize';
export const SUPPORT_INBOX_SEARCH_ISSUES_ROUTE_PATH =
  '/customer-support/inbox/search-issues';
// Called from task-manager's issue panel, so its path is a contract between
// the two apps: change it on both sides at once.
export const ISSUE_CRISP_CONVERSATIONS_ROUTE_PATH =
  '/customer-support/issue-conversations';

export const SUPPORT_INBOX_CONVERSATION_PAGE_SIZE = 30;
export const SUPPORT_INBOX_MESSAGE_PAGE_SIZE = 80;

export const CRISP_CONVERSATION_STATUSES = [
  'PENDING',
  'UNRESOLVED',
  'RESOLVED',
] as const;

export type CrispConversationStatus =
  (typeof CRISP_CONVERSATION_STATUSES)[number];

export const CRISP_MESSAGE_SENDERS = ['USER', 'OPERATOR'] as const;

export type CrispMessageSender = (typeof CRISP_MESSAGE_SENDERS)[number];

export const CRISP_CONVERSATION_STATUS_OPTIONS = [
  {
    id: 'e3c75729-32db-47f3-9b08-6c46da7196c8',
    value: 'PENDING',
    label: 'Pending',
    position: 0,
    color: 'yellow',
  },
  {
    id: '57e1a74a-a1cf-4235-be2d-132e0a248e2f',
    value: 'UNRESOLVED',
    label: 'Open',
    position: 1,
    color: 'blue',
  },
  {
    id: '2faa1e63-dcda-4981-bad6-9c1390d6ac01',
    value: 'RESOLVED',
    label: 'Resolved',
    position: 2,
    color: 'green',
  },
] as const;

export const CRISP_CONVERSATION_LAST_MESSAGE_FROM_OPTIONS = [
  {
    id: 'ef79d041-a98e-4363-b793-6dfaaad0055d',
    value: 'USER',
    label: 'Customer',
    position: 0,
    color: 'orange',
  },
  {
    id: 'fcc9803f-c45d-4566-beca-648ed23ac213',
    value: 'OPERATOR',
    label: 'Support',
    position: 1,
    color: 'blue',
  },
] as const;

export const CRISP_MESSAGE_SENDER_OPTIONS = [
  {
    id: '371d4b54-1474-44f0-a0ae-aa3696a0a8ad',
    value: 'USER',
    label: 'Customer',
    position: 0,
    color: 'orange',
  },
  {
    id: 'c7480906-4912-4e2f-a442-39940de2da6c',
    value: 'OPERATOR',
    label: 'Support',
    position: 1,
    color: 'blue',
  },
] as const;

export const buildCrispConversationUrl = ({
  websiteId,
  sessionId,
}: {
  websiteId: string;
  sessionId: string;
}): string => `https://app.crisp.chat/website/${websiteId}/inbox/${sessionId}/`;

// Server-scoped claim so the public web hook resolver can map a delivery's
// website back to the workspace that configured it.
export const getCrispWebsiteClaimKey = (websiteId: string): string =>
  `crisp:website-claim:${websiteId}`;

export const CRISP_SYNC_STATE_KEY = 'crisp:sync-state';
// Notes stored before auto-linking existed, or whose thread the sync skipped,
// are scanned from the CRM itself up to this point.
export const CRISP_NOTE_LINKS_SCANNED_AT_KEY = 'crisp:note-links-scanned-at';

// The web hook events the CRM stores; every other namespace is acknowledged
// and dropped.
export const HANDLED_CRISP_EVENTS = new Set([
  'message:send',
  'message:received',
  'message:updated',
  'message:removed',
  'session:request:initiated',
  'session:set_state',
  'session:set_email',
  'session:set_nickname',
  'session:set_segments',
  'session:set_data',
  'session:removed',
]);
