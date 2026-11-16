import { type ReportingPeriod } from '../../types/analytics';
import {
  type BcActivityRecord,
  type BcIssueRecord,
  type BcReviewRecord,
  type BcSubscriptionEventRecord,
  type BcTaskRecord,
  type MerchantRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import { type AnalyticsDataset } from '../analytics-metrics.util';

export const OCTOBER: ReportingPeriod = {
  start: '2026-10-01T00:00:00.000Z',
  end: '2026-11-01T00:00:00.000Z',
  fromDate: '2026-10-01',
  toDate: '2026-10-31',
  timezone: 'UTC',
  dayCount: 31,
};

export const buildClient = (
  overrides: Partial<VipClientRecord>,
): VipClientRecord => ({
  id: 'client-1',
  name: 'Rip Curl',
  shopDomain: 'ripcurl.myshopify.com',
  relationshipStatus: 'ACTIVE',
  statusChangedAt: null,
  lastBcContactAt: null,
  lastBcContactMemberId: null,
  awaitingReplySince: null,
  assignedAt: '2026-01-01T00:00:00.000Z',
  notes: null,
  appUsage: null,
  picId: 'tom',
  picAssignedById: null,
  teamId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

export const buildMerchant = (
  overrides: Partial<MerchantRecord>,
): MerchantRecord => ({
  id: 'merchant-bloy',
  name: 'ripcurl.myshopify.com',
  storeName: null,
  pricingPlan: 'GROWTH',
  using: true,
  installedAt: '2026-01-01T00:00:00.000Z',
  uninstalledAt: null,
  planStartedAt: null,
  vipClientId: 'client-1',
  app: { id: 'app-bloy', name: 'BLOY' },
  ...overrides,
});

export const buildActivity = (
  overrides: Partial<BcActivityRecord>,
): BcActivityRecord => ({
  id: 'activity-1',
  title: 'Message',
  summary: null,
  activityType: 'CRISP_MESSAGE',
  direction: 'OUTBOUND',
  topic: 'GENERAL',
  meetingStatus: null,
  isBcAuthored: true,
  actorMemberId: 'tom',
  occurredAt: '2026-10-10T00:00:00.000Z',
  appName: null,
  externalId: null,
  sourceUrl: null,
  developerIssueId: null,
  metadata: null,
  vipClientId: 'client-1',
  createdAt: '2026-10-10T00:00:00.000Z',
  ...overrides,
});

export const buildEvent = (
  overrides: Partial<BcSubscriptionEventRecord>,
): BcSubscriptionEventRecord => ({
  id: 'event-1',
  name: null,
  appName: 'BLOY',
  eventType: 'UPGRADE',
  oldPlan: 'GROWTH',
  newPlan: 'PLUS',
  occurredAt: '2026-10-15T00:00:00.000Z',
  mrrDelta: 100,
  isVerified: true,
  source: 'CRM_SYNC',
  externalId: null,
  isBcInfluenced: false,
  attributedMemberId: null,
  attributionEvidence: null,
  merchantId: 'merchant-bloy',
  opportunityId: null,
  vipClientId: 'client-1',
  ...overrides,
});

export const buildTask = (overrides: Partial<BcTaskRecord>): BcTaskRecord => ({
  id: 'task-1',
  title: 'Task',
  notes: null,
  category: 'FOLLOW_UP',
  customCategory: null,
  status: 'TODO',
  priority: 'MEDIUM',
  source: 'MANUAL',
  triggerType: null,
  triggerKey: null,
  outcome: null,
  outcomeStatus: null,
  completedAt: null,
  appName: null,
  history: null,
  ownerId: 'tom',
  vipClientId: 'client-1',
  issueId: null,
  opportunityId: null,
  createdAt: '2026-10-05T00:00:00.000Z',
  ...overrides,
});

export const buildIssue = (
  overrides: Partial<BcIssueRecord>,
): BcIssueRecord => ({
  id: 'issue-1',
  title: 'Points missing',
  summary: null,
  classification: null,
  status: 'OPEN',
  source: 'AI',
  appNames: ['BLOY'],
  detectedAt: '2026-10-02T00:00:00.000Z',
  lastEvidenceAt: null,
  resolvedAt: null,
  resolvedByMemberId: null,
  dismissReason: null,
  confidence: null,
  evidence: null,
  history: null,
  vipClientId: 'client-1',
  createdAt: '2026-10-02T00:00:00.000Z',
  ...overrides,
});

export const buildReview = (
  overrides: Partial<BcReviewRecord>,
): BcReviewRecord => ({
  id: 'review-1',
  name: 'Rip Curl',
  appName: 'BLOY',
  rating: 5,
  body: null,
  publishedAt: '2026-10-20T00:00:00.000Z',
  reviewUrl: null,
  isVerified: true,
  creditedMemberId: 'tom',
  evidenceActivityId: 'activity-1',
  externalId: null,
  source: 'INGEST',
  vipClientId: 'client-1',
  ...overrides,
});

// PIC changes put in `activities` also feed the ownership log, as the
// loader's separate all-time query would.
export const buildDataset = (
  overrides: Partial<AnalyticsDataset>,
): AnalyticsDataset => {
  const activities = overrides.activities ?? [];

  return {
    period: OCTOBER,
    memberIds: ['tom'],
    appName: null,
    clients: [buildClient({})],
    merchants: [buildMerchant({})],
    activities,
    reviews: [],
    issues: [],
    tasks: [],
    opportunities: [],
    subscriptionEvents: [],
    picChanges: activities.filter(
      (activity) => activity.activityType === 'PIC_CHANGE',
    ),
    statusChanges: activities.filter(
      (activity) => activity.activityType === 'STATUS_CHANGE',
    ),
    attributionCorrections: activities.filter(
      (activity) => activity.metadata?.correction === 'ATTRIBUTION',
    ),
    upsellAttributionDays: 90,
    ...overrides,
  };
};
