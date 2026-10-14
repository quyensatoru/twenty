import {
  type CrispConversationStatus,
  type CrispMessageSender,
} from '../constants/crisp';

export type SupportInboxConversation = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: CrispConversationStatus | null;
  appName: string | null;
  shopDomain: string | null;
  lastMessageAt: string | null;
  lastMessageExcerpt: string | null;
  lastMessageFrom: CrispMessageSender | null;
  waitingSince: string | null;
  startedAt: string | null;
  messageCount: number | null;
  segments: string[] | null;
  operatorName: string | null;
  country: string | null;
  sessionId: string | null;
  websiteId: string | null;
  sessionData: Record<string, unknown> | null;
  aiSummary: string | null;
  aiProblem: string | null;
  aiNextStep: string | null;
  aiSummaryAt: string | null;
  aiSummaryMessageCount: number | null;
  merchant: { id: string; name: string | null } | null;
};

export type SupportInboxMessage = {
  id: string;
  text: string | null;
  sender: CrispMessageSender | null;
  senderName: string | null;
  messageType: string | null;
  sentAt: string | null;
  content: unknown;
};

export type SupportInboxIssue = {
  id: string;
  issueKey: string | null;
  title: string | null;
  statusName: string | null;
  statusColor: string | null;
};

export type SupportInboxMessagesResult = {
  success: true;
  conversation: SupportInboxConversation;
  messages: SupportInboxMessage[];
  hasOlder: boolean;
  issues: SupportInboxIssue[];
};

export type SupportInboxLinkIssueResult = {
  success: true;
  issues: SupportInboxIssue[];
};

export type SupportInboxSearchIssuesResult = {
  success: true;
  issues: SupportInboxIssue[];
};

export type SupportInboxSummary = {
  aiSummary: string;
  aiProblem: string | null;
  aiNextStep: string | null;
  aiSummaryAt: string;
  aiSummaryMessageCount: number;
};

export type SupportInboxSummarizeResult = {
  success: true;
  summary: SupportInboxSummary;
};
