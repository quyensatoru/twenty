// Shapes of the records as the routes read them. Option values mirror
// constants/select-options.ts.

export type RelationshipStatus =
  | 'ACTIVE'
  | 'WAITING_FOR_CLIENT'
  | 'FOLLOW_UP'
  | 'AT_RISK'
  | 'INACTIVE';

export type AppHealth = 'HEALTHY' | 'AT_RISK' | 'INACTIVE';

export type SubscriptionLifecycle = 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'UNINSTALLED';

export type ReviewState = 'REVIEWED' | 'NEEDS_REVIEW' | 'NOT_ELIGIBLE';

export type BcMemberRole = 'BC' | 'MANAGER';

export type IssueStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export type IssueSource = 'AI' | 'MANUAL';

export type TaskCategory =
  | 'CLIENT_ISSUE'
  | 'FOLLOW_UP'
  | 'UPSELL'
  | 'ONBOARDING'
  | 'RETENTION'
  | 'OTHER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskSource = 'MANUAL' | 'AUTO';

export type TaskTriggerType =
  | 'ISSUE'
  | 'NO_REPLY'
  | 'NEW_VIP'
  | 'DOWNGRADE'
  | 'UNINSTALL'
  | 'USAGE_THRESHOLD';

export type TaskOutcomeStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'NOT_QUALIFIED';

export type ActivityType =
  | 'CRISP_MESSAGE'
  | 'EMAIL'
  | 'MEETING'
  | 'CALL'
  | 'NOTE'
  | 'REVIEW_REQUEST'
  | 'PIC_CHANGE'
  | 'STATUS_CHANGE'
  | 'ISSUE_DETECTED'
  | 'ISSUE_UPDATED'
  | 'ISSUE_RESOLVED'
  | 'ISSUE_DISMISSED'
  | 'TASK'
  | 'DEVELOPER_TASK'
  | 'SUBSCRIPTION'
  | 'USAGE'
  | 'REVIEW'
  | 'SYSTEM';

export type ActivityDirection = 'OUTBOUND' | 'INBOUND' | 'INTERNAL';

export type ActivityTopic =
  | 'GENERAL'
  | 'UPSELL'
  | 'REVIEW'
  | 'ISSUE'
  | 'ONBOARDING'
  | 'RETENTION';

export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type RecordSource = 'MANUAL' | 'INGEST' | 'CRM_SYNC';

export type SubscriptionEventType =
  | 'INSTALL'
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'UNINSTALL'
  | 'REINSTALL'
  | 'CANCEL';

export type OpportunityStatus = 'OPEN' | 'CONVERTED' | 'LOST';

export type PaymentKind = 'CHARGE' | 'REFUND';

export type HistoryEntry = {
  at: string;
  actorMemberId: string | null;
  action: string;
  from?: string | null;
  to?: string | null;
  note?: string | null;
};

export type IssueEvidence = {
  conversationId: string | null;
  messageId: string | null;
  excerpt: string;
  sentAt: string | null;
  url: string | null;
};

export type AppUsageEntry = {
  used: number;
  limit: number;
  cycle: string;
  plan: string | null;
  at: string;
};

export type MerchantRecord = {
  id: string;
  name: string | null;
  storeName: string | null;
  pricingPlan: string | null;
  using: boolean | null;
  installedAt: string | null;
  uninstalledAt: string | null;
  planStartedAt: string | null;
  vipClientId: string | null;
  app: { id: string; name: string | null } | null;
};

export type VipClientRecord = {
  id: string;
  name: string | null;
  shopDomain: string | null;
  relationshipStatus: RelationshipStatus;
  statusChangedAt: string | null;
  lastBcContactAt: string | null;
  lastBcContactMemberId: string | null;
  awaitingReplySince: string | null;
  assignedAt: string | null;
  notes: string | null;
  appUsage: Record<string, AppUsageEntry> | null;
  picId: string | null;
  picAssignedById: string | null;
  teamId: string | null;
  createdAt: string;
};

export type BcIssueRecord = {
  id: string;
  title: string | null;
  summary: string | null;
  classification: string | null;
  status: IssueStatus;
  source: IssueSource;
  appNames: string[] | null;
  detectedAt: string | null;
  lastEvidenceAt: string | null;
  resolvedAt: string | null;
  resolvedByMemberId: string | null;
  dismissReason: string | null;
  confidence: number | null;
  evidence: IssueEvidence[] | null;
  history: HistoryEntry[] | null;
  vipClientId: string | null;
  createdAt: string;
};

export type BcTaskRecord = {
  id: string;
  title: string | null;
  notes: string | null;
  category: TaskCategory;
  customCategory: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  triggerType: TaskTriggerType | null;
  triggerKey: string | null;
  outcome: string | null;
  outcomeStatus: TaskOutcomeStatus | null;
  completedAt: string | null;
  appName: string | null;
  history: HistoryEntry[] | null;
  ownerId: string | null;
  vipClientId: string | null;
  issueId: string | null;
  opportunityId: string | null;
  createdAt: string;
};

export type BcActivityRecord = {
  id: string;
  title: string | null;
  summary: string | null;
  activityType: ActivityType;
  direction: ActivityDirection;
  topic: ActivityTopic;
  meetingStatus: MeetingStatus | null;
  isBcAuthored: boolean;
  actorMemberId: string | null;
  occurredAt: string | null;
  appName: string | null;
  externalId: string | null;
  sourceUrl: string | null;
  developerIssueId: string | null;
  metadata: Record<string, unknown> | null;
  vipClientId: string | null;
  createdAt: string;
};

export type BcReviewRecord = {
  id: string;
  name: string | null;
  appName: string | null;
  rating: number | null;
  body: string | null;
  publishedAt: string | null;
  reviewUrl: string | null;
  isVerified: boolean;
  creditedMemberId: string | null;
  evidenceActivityId: string | null;
  externalId: string | null;
  source: RecordSource;
  vipClientId: string | null;
};

export type BcSubscriptionEventRecord = {
  id: string;
  name: string | null;
  appName: string | null;
  eventType: SubscriptionEventType;
  oldPlan: string | null;
  newPlan: string | null;
  occurredAt: string | null;
  mrrDelta: number | null;
  isVerified: boolean;
  source: RecordSource;
  externalId: string | null;
  isBcInfluenced: boolean;
  attributedMemberId: string | null;
  attributionEvidence: Record<string, unknown> | null;
  merchantId: string | null;
  opportunityId: string | null;
  vipClientId: string | null;
};

export type BcOpportunityRecord = {
  id: string;
  name: string | null;
  appName: string | null;
  planCode: string | null;
  billingCycle: string | null;
  opportunityKey: string | null;
  usagePercent: number | null;
  usageUsed: number | null;
  usageLimit: number | null;
  status: OpportunityStatus;
  convertedAt: string | null;
  vipClientId: string | null;
  createdAt: string;
};

export type BcPaymentRecord = {
  id: string;
  name: string | null;
  appName: string | null;
  kind: PaymentKind;
  amount: number | null;
  originalAmount: number | null;
  currencyCode: string | null;
  paidAt: string | null;
  invoiceId: string | null;
  externalId: string | null;
  isOneTime: boolean;
  vipClientId: string | null;
};

export type BcPlanRecord = {
  id: string;
  name: string | null;
  appName: string | null;
  planCode: string | null;
  monthlyPrice: number | null;
  rank: number | null;
  usageAllowance: number | null;
  isTrial: boolean;
};

export type BcTeamRecord = {
  id: string;
  name: string | null;
  description: string | null;
};

export type BcMemberRecord = {
  id: string;
  name: string | null;
  memberRole: BcMemberRole;
  crispOperatorNames: string[] | null;
  isActive: boolean;
  memberId: string | null;
  teamId: string | null;
};

export type WorkspaceMemberSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
};
