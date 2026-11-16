import {
  type ActivityDirection,
  type ActivityTopic,
  type ActivityType,
  type AppHealth,
  type AppUsageEntry,
  type IssueEvidence,
  type IssueSource,
  type IssueStatus,
  type MeetingStatus,
  type RelationshipStatus,
  type ReviewState,
  type SubscriptionLifecycle,
  type TaskCategory,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
} from './bc-records';
import { type SortState } from '../utils/sort-records.util';

export type DashboardKpi = 'ALL' | 'ACTIVE' | 'NEED_FOLLOW_UP' | 'AT_RISK';

export type ReviewFilter = 'REVIEWED' | 'NEEDS_REVIEW';

export type ClientListFilters = {
  search: string;
  appName: string | null;
  plan: string | null;
  // A workspace member id, or UNASSIGNED for clients without a PIC.
  picId: string | null;
  status: RelationshipStatus | null;
  appHealth: AppHealth | null;
  review: ReviewFilter | null;
  kpi: DashboardKpi;
};

export type ClientListRequest = ClientListFilters & {
  sort: SortState;
  page: number;
  pageSize: number;
};

export type ClientAppChat = {
  conversationId: string;
  crispUrl: string | null;
  preview: string | null;
  lastMessageAt: string | null;
};

export type ClientAppEntry = {
  merchantId: string;
  appName: string;
  plan: string | null;
  planLabel: string | null;
  lifecycle: SubscriptionLifecycle;
  health: AppHealth;
  review: ReviewState;
  installedAt: string | null;
  usage: AppUsageEntry | null;
  chat: ClientAppChat | null;
};

export type ClientRow = {
  id: string;
  name: string;
  shopDomain: string | null;
  status: RelationshipStatus;
  picId: string | null;
  picName: string | null;
  teamId: string | null;
  lastBcContactAt: string | null;
  lastBcContactByName: string | null;
  apps: ClientAppEntry[];
  reviewedCount: number;
  eligibleReviewCount: number;
  openIssueCount: number;
  crispConversationId: string | null;
};

export type DashboardKpiCounts = {
  total: number;
  active: number;
  needFollowUp: number;
  atRisk: number;
};

export type ClientListResult = {
  rows: ClientRow[];
  kpis: DashboardKpiCounts;
  page: number;
  pageCount: number;
  total: number;
  planOptions: { value: string; label: string }[];
};

export type ClientIssueItem = {
  id: string;
  title: string;
  summary: string | null;
  classification: string | null;
  status: IssueStatus;
  source: IssueSource;
  appNames: string[];
  detectedAt: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  dismissReason: string | null;
  confidence: number | null;
  evidence: IssueEvidence[];
};

export type ClientTaskItem = {
  id: string;
  title: string;
  category: TaskCategory;
  customCategory: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  ownerName: string | null;
  createdAt: string;
};

export type ClientActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  summary: string | null;
  direction: ActivityDirection;
  topic: ActivityTopic;
  meetingStatus: MeetingStatus | null;
  isBcAuthored: boolean;
  actorName: string | null;
  occurredAt: string | null;
  appName: string | null;
  sourceUrl: string | null;
  developerIssueId: string | null;
};

export type ClientReviewItem = {
  id: string;
  appName: string | null;
  reviewerName: string | null;
  rating: number | null;
  publishedAt: string | null;
  reviewUrl: string | null;
  isVerified: boolean;
  creditedName: string | null;
};

// Present only for callers allowed to see financial data.
export type ClientLifetimeRevenue =
  | { status: 'AVAILABLE'; amount: number; currency: string }
  | { status: 'UNAVAILABLE'; amount: null; currency: string };

export type ClientDeveloperTask = {
  issueId: string;
  title: string;
  appName: string | null;
  createdAt: string | null;
  createdByName: string | null;
};

export type ClientDetailResult = {
  client: ClientRow & { notes: string | null; assignedAt: string | null };
  developerTasks: ClientDeveloperTask[];
  openIssues: ClientIssueItem[];
  closedIssues: ClientIssueItem[];
  openTasks: ClientTaskItem[];
  activities: ClientActivityItem[];
  reviews: ClientReviewItem[];
  lifetimeRevenue?: ClientLifetimeRevenue;
  canEdit: boolean;
};

export type ClientSaveRequest = {
  vipClientId: string | null;
  name?: string;
  shopDomain?: string;
  picId?: string | null;
  // Admins pick the owning team; managers default to the team they manage.
  teamId?: string | null;
  notes?: string | null;
};

export type MerchantDomainOption = {
  shopDomain: string;
  storeName: string | null;
  appNames: string[];
  vipClientId: string | null;
};

export type ActivityLogRequest = {
  vipClientId: string;
  type: 'MEETING' | 'EMAIL' | 'CALL' | 'NOTE' | 'REVIEW_REQUEST';
  topic: ActivityTopic;
  meetingStatus: MeetingStatus | null;
  occurredAt: string | null;
  summary: string;
  appName: string | null;
};

export type IssueCreateRequest = {
  vipClientId: string;
  title: string;
  summary: string | null;
  appNames: string[];
};

export type DeveloperProject = {
  id: string;
  name: string;
  key: string | null;
  appName: string | null;
  defaultStatusId: string | null;
};

export type ReviewSaveRequest = {
  vipClientId: string;
  reviewId: string | null;
  appName: string;
  rating: number | null;
  publishedAt: string | null;
  reviewUrl: string | null;
  reviewerName: string | null;
  body: string | null;
};
