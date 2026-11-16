import {
  type AnalyticsMetricKey,
  type AnalyticsTrendBucket,
  type KpiValue,
  type ReportingPeriod,
} from '../types/analytics';
import {
  type BcActivityRecord,
  type BcIssueRecord,
  type BcOpportunityRecord,
  type BcReviewRecord,
  type BcSubscriptionEventRecord,
  type BcTaskRecord,
  type MerchantRecord,
  type RelationshipStatus,
  type TaskCategory,
  type VipClientRecord,
} from '../types/bc-records';
import { buildOwnershipIndex, readStatusAt } from './analytics-ownership.util';
import { buildTrendBuckets, isInPeriod } from './analytics-period.util';

const DAY_MS = 86_400_000;

// Contact per spec 5.2: BC-authored Crisp/email messages and completed
// meetings. Calls and review requests are BC interactions (logged
// consultations) but not "contact"; notes and status changes are neither.
const CONTACT_ACTIVITY_TYPES = new Set(['CRISP_MESSAGE', 'EMAIL']);
const CONSULTATION_ACTIVITY_TYPES = new Set(['CALL', 'REVIEW_REQUEST']);

export type AnalyticsDataset = {
  period: ReportingPeriod;
  // null: every BC (an admin's team view).
  memberIds: string[] | null;
  appName: string | null;
  clients: VipClientRecord[];
  merchants: MerchantRecord[];
  activities: BcActivityRecord[];
  reviews: BcReviewRecord[];
  issues: BcIssueRecord[];
  tasks: BcTaskRecord[];
  opportunities: BcOpportunityRecord[];
  subscriptionEvents: BcSubscriptionEventRecord[];
  // Every PIC and status change before the period end, for point-in-time
  // ownership and status.
  picChanges: BcActivityRecord[];
  statusChanges: BcActivityRecord[];
  // Manager attribution corrections (SYSTEM activities with
  // metadata.correction === 'ATTRIBUTION'); a corrected record's credit is
  // taken as set, without re-checking the outreach evidence.
  attributionCorrections: BcActivityRecord[];
  upsellAttributionDays: number;
};

export type MetricRecords = {
  meetingsCompleted: BcActivityRecord[];
  bcInteractions: BcActivityRecord[];
  clientsContacted: VipClientRecord[];
  coveredClients: VipClientRecord[];
  reviewsAcquired: BcReviewRecord[];
  issuesResolved: BcIssueRecord[];
  tasksCompleted: BcTaskRecord[];
  followUpsCompleted: BcTaskRecord[];
  upsellOpportunities: BcOpportunityRecord[];
  bcInfluencedUpgrades: BcSubscriptionEventRecord[];
  portfolioUpgrades: BcSubscriptionEventRecord[];
  downgrades: BcSubscriptionEventRecord[];
  uninstalls: BcSubscriptionEventRecord[];
  managedClients: VipClientRecord[];
  newVipClients: BcActivityRecord[];
  transferredClients: BcActivityRecord[];
  newIssues: BcIssueRecord[];
  recoveredClients: VipClientRecord[];
  tasksCreated: BcTaskRecord[];
  openTasks: BcTaskRecord[];
  automaticTasks: BcTaskRecord[];
  manualTasks: BcTaskRecord[];
};

export type AnalyticsComputation = {
  records: MetricRecords;
  kpis: Partial<Record<AnalyticsMetricKey, KpiValue>>;
  portfolioClientIds: Set<string>;
  trend: AnalyticsTrendBucket[];
  statusSnapshot: { status: RelationshipStatus; count: number }[];
  tasksByCategory: {
    category: TaskCategory;
    count: number;
    customLabels: string[];
  }[];
  taskOutcomes: { outcomeStatus: string; count: number }[];
};

const STATUS_ORDER: RelationshipStatus[] = [
  'ACTIVE',
  'WAITING_FOR_CLIENT',
  'FOLLOW_UP',
  'AT_RISK',
  'INACTIVE',
];

const CATEGORY_ORDER: TaskCategory[] = [
  'CLIENT_ISSUE',
  'FOLLOW_UP',
  'UPSELL',
  'ONBOARDING',
  'RETENTION',
  'OTHER',
];

const sameApp = (left: string | null | undefined, right: string): boolean =>
  (left ?? '').toUpperCase() === right.toUpperCase();

const readTime = (value: string | null | undefined): number =>
  typeof value === 'string' && value.length > 0
    ? Date.parse(value)
    : Number.NaN;

const readMetadataString = (
  metadata: Record<string, unknown> | null,
  key: string,
): string | null => {
  const value = metadata?.[key];

  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const isMemberIn = (
  memberIds: string[] | null,
  memberId: string | null | undefined,
): boolean =>
  typeof memberId === 'string' &&
  memberId.length > 0 &&
  (memberIds === null || memberIds.includes(memberId));

const isCompletedMeeting = (activity: BcActivityRecord): boolean =>
  activity.activityType === 'MEETING' && activity.meetingStatus === 'COMPLETED';

export const isContactActivity = (activity: BcActivityRecord): boolean =>
  activity.isBcAuthored &&
  (CONTACT_ACTIVITY_TYPES.has(activity.activityType) ||
    isCompletedMeeting(activity));

export const isInteractionActivity = (activity: BcActivityRecord): boolean =>
  isContactActivity(activity) ||
  (activity.isBcAuthored &&
    CONSULTATION_ACTIVITY_TYPES.has(activity.activityType));

const dedupeBy = <TRecord extends { id: string }>(
  records: TRecord[],
  readKey: (record: TRecord) => string,
): TRecord[] => {
  const seen = new Set<string>();

  return records.filter((record) => {
    const key = readKey(record);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

const activityKey = (activity: BcActivityRecord): string =>
  activity.externalId ?? activity.id;

// The same contact imported twice, or logged by hand next to its import,
// has no shared external id; same actor, client, kind and minute is one event.
const MINUTE_MS = 60_000;

const interactionKey = (activity: BcActivityRecord): string => {
  const minute = Math.floor(readTime(activity.occurredAt) / MINUTE_MS);
  const kind = isCompletedMeeting(activity) ? 'MEETING' : activity.activityType;

  return `${activity.actorMemberId ?? ''}|${activity.vipClientId ?? ''}|${kind}|${minute}`;
};

const dedupeInteractions = (
  activities: BcActivityRecord[],
): BcActivityRecord[] =>
  dedupeBy(dedupeBy(activities, activityKey), interactionKey);

const TASK_STATUSES = new Set([
  'TODO',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

const readStatusEntries = (task: BcTaskRecord) =>
  (task.history ?? [])
    .filter(
      (entry) =>
        typeof entry.to === 'string' &&
        TASK_STATUSES.has(entry.to) &&
        !Number.isNaN(readTime(entry.at)),
    )
    .sort((left, right) => readTime(left.at) - readTime(right.at));

// Every time the task moved to Completed. Reopening only clears completedAt,
// so the history keeps a past period's completions countable.
export const readTaskCompletionTimes = (task: BcTaskRecord): string[] => {
  const times = readStatusEntries(task)
    .filter((entry) => entry.to === 'COMPLETED')
    .map((entry) => entry.at);

  if (task.completedAt !== null && !times.includes(task.completedAt)) {
    times.push(task.completedAt);
  }

  return times;
};

export const wasTaskCompletedIn = (
  task: BcTaskRecord,
  period: { start: string; end: string },
): boolean =>
  readTaskCompletionTimes(task).some((at) => isInPeriod(at, period));

// When the task was closed: completion time, or the cancellation recorded in
// its history. A cancelled task without a recorded time counts as closed.
export const readTaskClosedAt = (task: BcTaskRecord): string | null => {
  if (task.status === 'COMPLETED') {
    return task.completedAt;
  }

  if (task.status === 'CANCELLED') {
    const cancellation = [...(task.history ?? [])]
      .reverse()
      .find((entry) => entry.to === 'CANCELLED');

    return cancellation?.at ?? '1970-01-01T00:00:00.000Z';
  }

  return null;
};

export const isTaskOpenAt = (task: BcTaskRecord, instant: string): boolean => {
  if (!(readTime(task.createdAt) < readTime(instant))) {
    return false;
  }

  // Replay the status log when there is one: a task reopened later was
  // still closed at the instant.
  const entries = readStatusEntries(task).filter(
    (entry) => readTime(entry.at) < readTime(instant),
  );
  const lastEntry = entries[entries.length - 1];

  if (lastEntry !== undefined) {
    return lastEntry.to === 'TODO' || lastEntry.to === 'IN_PROGRESS';
  }

  if (readStatusEntries(task).length > 0) {
    return true;
  }

  const closedAt = readTaskClosedAt(task);

  return closedAt === null || readTime(closedAt) >= readTime(instant);
};

export const isMerchantActiveAt = (
  merchant: MerchantRecord,
  instant: number,
): boolean => {
  const installedAt = readTime(merchant.installedAt);

  if (!Number.isNaN(installedAt) && installedAt >= instant) {
    return false;
  }

  if (merchant.using !== false) {
    return true;
  }

  const uninstalledAt = readTime(merchant.uninstalledAt);

  return !Number.isNaN(uninstalledAt) && uninstalledAt >= instant;
};

// An upgrade earns BC credit only with a verified flag from the attribution
// step AND a contact by the credited BC on that client before the change,
// so a post-upgrade message can never claim it.
export const hasAttributionCorrection = (
  event: BcSubscriptionEventRecord,
): boolean => {
  const corrections = event.attributionEvidence?.corrections;

  return Array.isArray(corrections) && corrections.length > 0;
};

export const readCorrectedRecordIds = (
  corrections: BcActivityRecord[],
): Set<string> =>
  new Set(
    corrections.flatMap((activity) => {
      const recordId = activity.metadata?.recordId;

      return activity.metadata?.correction === 'ATTRIBUTION' &&
        typeof recordId === 'string'
        ? [recordId]
        : [];
    }),
  );

export const isUpgradeCreditedTo = ({
  event,
  memberIds,
  activities,
  attributionDays,
  isCorrected = false,
}: {
  event: BcSubscriptionEventRecord;
  memberIds: string[] | null;
  activities: BcActivityRecord[];
  attributionDays: number;
  isCorrected?: boolean;
}): boolean => {
  if (
    event.eventType !== 'UPGRADE' ||
    !event.isVerified ||
    !event.isBcInfluenced ||
    !isMemberIn(memberIds, event.attributedMemberId)
  ) {
    return false;
  }

  if (isCorrected || hasAttributionCorrection(event)) {
    return true;
  }

  const upgradedAt = readTime(event.occurredAt);
  const windowStart = upgradedAt - attributionDays * DAY_MS;

  return activities.some((activity) => {
    const occurredAt = readTime(activity.occurredAt);

    return (
      activity.vipClientId === event.vipClientId &&
      activity.actorMemberId === event.attributedMemberId &&
      isInteractionActivity(activity) &&
      occurredAt < upgradedAt &&
      occurredAt >= windowStart
    );
  });
};

// A review is acquired by a BC when verified, credited and backed by an
// outreach logged before it was published.
export const isReviewCreditedTo = ({
  review,
  memberIds,
  activities,
  isCorrected = false,
}: {
  review: BcReviewRecord;
  memberIds: string[] | null;
  activities: BcActivityRecord[];
  isCorrected?: boolean;
}): boolean => {
  if (isCorrected) {
    return review.isVerified && isMemberIn(memberIds, review.creditedMemberId);
  }

  if (
    !review.isVerified ||
    review.evidenceActivityId === null ||
    !isMemberIn(memberIds, review.creditedMemberId)
  ) {
    return false;
  }

  const evidence = activities.find(
    (activity) => activity.id === review.evidenceActivityId,
  );

  // Evidence older than the loaded window was checked when the credit was set.
  return (
    evidence === undefined ||
    readTime(evidence.occurredAt) < readTime(review.publishedAt)
  );
};

const isIssueOpenAt = (issue: BcIssueRecord, instant: number): boolean => {
  const detectedAt = readTime(issue.detectedAt ?? issue.createdAt);

  if (Number.isNaN(detectedAt) || detectedAt > instant) {
    return false;
  }

  if (issue.status === 'OPEN') {
    return true;
  }

  const closedAt = readTime(issue.resolvedAt);

  return Number.isNaN(closedAt) || closedAt > instant;
};

const count = (records: unknown[]): KpiValue => ({
  value: records.length,
  status: 'OK',
});

const rate = (numerator: number, denominator: number): KpiValue => ({
  value: denominator === 0 ? null : numerator / denominator,
  status: 'OK',
  numerator,
  denominator,
});

export const computeAnalytics = (
  dataset: AnalyticsDataset,
): AnalyticsComputation => {
  const { period, memberIds, appName } = dataset;
  const endTime = readTime(period.end);
  const appClientIds =
    appName === null
      ? null
      : new Set(
          dataset.merchants
            .filter((merchant) => sameApp(merchant.app?.name, appName))
            .flatMap((merchant) =>
              merchant.vipClientId === null ? [] : [merchant.vipClientId],
            ),
        );
  const isInAppCohort = (vipClientId: string | null): boolean =>
    appClientIds === null ||
    (vipClientId !== null && appClientIds.has(vipClientId));
  // Records tagged with another app never count under a product filter;
  // untagged ones count when their client uses the product.
  const matchesApp = (
    recordAppNames: (string | null)[],
    vipClientId: string | null,
  ): boolean => {
    if (appName === null) {
      return true;
    }

    const tagged = recordAppNames.filter(
      (name): name is string => typeof name === 'string' && name.length > 0,
    );

    return tagged.length > 0
      ? tagged.some((name) => sameApp(name, appName))
      : isInAppCohort(vipClientId);
  };

  const ownership = buildOwnershipIndex(dataset.clients, dataset.picChanges);
  const correctedIds = readCorrectedRecordIds(dataset.attributionCorrections);
  const clientById = new Map(
    dataset.clients.map((client) => [client.id, client]),
  );
  // Owned by one of the members at that instant, per the PIC log.
  const isOwnedAt = (
    vipClientId: string | null,
    instant: string | null,
  ): boolean =>
    vipClientId !== null &&
    clientById.has(vipClientId) &&
    isInAppCohort(vipClientId) &&
    isMemberIn(memberIds, ownership.ownerAt(vipClientId, readTime(instant)));
  const snapshotInstant = new Date(endTime - 1).toISOString();

  const managedClients = dataset.clients.filter((client) =>
    isOwnedAt(client.id, snapshotInstant),
  );
  const portfolioClientIds = new Set(managedClients.map((client) => client.id));

  const memberActivities = dataset.activities.filter(
    (activity) =>
      isMemberIn(memberIds, activity.actorMemberId) &&
      matchesApp([activity.appName], activity.vipClientId),
  );
  const periodActivities = memberActivities.filter((activity) =>
    isInPeriod(activity.occurredAt, period),
  );

  const meetingsCompleted = dedupeBy(
    periodActivities.filter(
      (activity) =>
        activity.activityType === 'MEETING' &&
        activity.meetingStatus === 'COMPLETED',
    ),
    activityKey,
  );
  const bcInteractions = dedupeInteractions(
    periodActivities.filter(isInteractionActivity),
  );
  // Eligible: the client was assigned to one of the members when contacted.
  const contactedIds = new Set(
    bcInteractions.flatMap((activity) =>
      isContactActivity(activity) &&
      isOwnedAt(activity.vipClientId, activity.occurredAt)
        ? [activity.vipClientId as string]
        : [],
    ),
  );
  const clientsContacted = dataset.clients.filter((client) =>
    contactedIds.has(client.id),
  );
  const coveredClients = managedClients.filter((client) =>
    contactedIds.has(client.id),
  );

  const reviewsAcquired = dedupeBy(
    dataset.reviews.filter(
      (review) =>
        isInPeriod(review.publishedAt, period) &&
        matchesApp([review.appName], review.vipClientId) &&
        isReviewCreditedTo({
          review,
          memberIds,
          activities: dataset.activities,
          isCorrected: correctedIds.has(review.id),
        }),
    ),
    (review) => review.externalId ?? review.id,
  );

  const issuesResolved = dataset.issues.filter(
    (issue) =>
      issue.status === 'RESOLVED' &&
      isInPeriod(issue.resolvedAt, period) &&
      isMemberIn(memberIds, issue.resolvedByMemberId) &&
      matchesApp(issue.appNames ?? [], issue.vipClientId),
  );

  const memberTasks = dataset.tasks.filter(
    (task) =>
      isMemberIn(memberIds, task.ownerId) &&
      matchesApp([task.appName], task.vipClientId),
  );
  const tasksCompleted = memberTasks.filter((task) =>
    wasTaskCompletedIn(task, period),
  );
  const followUpsCompleted = tasksCompleted.filter(
    (task) => task.category === 'FOLLOW_UP',
  );
  const tasksCreated = memberTasks.filter((task) =>
    isInPeriod(task.createdAt, period),
  );
  const openTasks = memberTasks.filter((task) =>
    isTaskOpenAt(task, period.end),
  );

  const upsellOpportunities = dataset.opportunities.filter(
    (opportunity) =>
      isInPeriod(opportunity.createdAt, period) &&
      isOwnedAt(opportunity.vipClientId, opportunity.createdAt) &&
      matchesApp([opportunity.appName], opportunity.vipClientId),
  );
  const convertedOpportunities = upsellOpportunities.filter(
    (opportunity) => opportunity.status === 'CONVERTED',
  );

  const periodEvents = dataset.subscriptionEvents.filter(
    (event) =>
      event.isVerified &&
      isInPeriod(event.occurredAt, period) &&
      matchesApp([event.appName], event.vipClientId),
  );
  const portfolioUpgrades = periodEvents.filter(
    (event) =>
      event.eventType === 'UPGRADE' &&
      isOwnedAt(event.vipClientId, event.occurredAt),
  );
  // Credit follows the BC who acted, even after the client changed PIC.
  const bcInfluencedUpgrades = periodEvents.filter((event) =>
    isUpgradeCreditedTo({
      event,
      memberIds,
      activities: dataset.activities,
      attributionDays: dataset.upsellAttributionDays,
      isCorrected: correctedIds.has(event.id),
    }),
  );
  const downgrades = periodEvents.filter(
    (event) =>
      event.eventType === 'DOWNGRADE' &&
      isOwnedAt(event.vipClientId, event.occurredAt),
  );
  const uninstalls = periodEvents.filter(
    (event) =>
      event.eventType === 'UNINSTALL' &&
      isOwnedAt(event.vipClientId, event.occurredAt),
  );

  const picChanges = dataset.picChanges.filter(
    (activity) =>
      activity.activityType === 'PIC_CHANGE' &&
      isInPeriod(activity.occurredAt, period) &&
      isMemberIn(
        memberIds,
        readMetadataString(activity.metadata, 'toMemberId'),
      ) &&
      isInAppCohort(activity.vipClientId),
  );
  const distinctByClient = (activities: BcActivityRecord[]) =>
    dedupeBy(activities, (activity) => activity.vipClientId ?? activity.id);
  const newVipClients = distinctByClient(
    picChanges.filter(
      (activity) =>
        readMetadataString(activity.metadata, 'fromMemberId') === null,
    ),
  );
  const transferredClients = distinctByClient(
    picChanges.filter(
      (activity) =>
        readMetadataString(activity.metadata, 'fromMemberId') !== null,
    ),
  );

  const newIssues = dataset.issues.filter(
    (issue) =>
      isInPeriod(issue.detectedAt ?? issue.createdAt, period) &&
      isOwnedAt(issue.vipClientId, issue.detectedAt ?? issue.createdAt) &&
      matchesApp(issue.appNames ?? [], issue.vipClientId),
  );

  const issuesByClient = new Map<string, BcIssueRecord[]>();

  for (const issue of dataset.issues) {
    if (issue.vipClientId === null) {
      continue;
    }

    issuesByClient.set(issue.vipClientId, [
      ...(issuesByClient.get(issue.vipClientId) ?? []),
      issue,
    ]);
  }

  // The client left At Risk because a BC confirmed its last open issue
  // resolved; a dismissal (false positive) is not a recovery.
  const recoveredClients = dataset.clients.filter((client) =>
    (issuesByClient.get(client.id) ?? []).some((issue) => {
      if (
        issue.status !== 'RESOLVED' ||
        issue.resolvedByMemberId === null ||
        !isInPeriod(issue.resolvedAt, period) ||
        !isOwnedAt(client.id, issue.resolvedAt) ||
        !matchesApp(issue.appNames ?? [], client.id)
      ) {
        return false;
      }

      const resolvedAt = readTime(issue.resolvedAt);

      return !(issuesByClient.get(client.id) ?? []).some(
        (other) => other.id !== issue.id && isIssueOpenAt(other, resolvedAt),
      );
    }),
  );

  const records: MetricRecords = {
    meetingsCompleted,
    bcInteractions,
    clientsContacted,
    coveredClients,
    reviewsAcquired,
    issuesResolved,
    tasksCompleted,
    followUpsCompleted,
    upsellOpportunities,
    bcInfluencedUpgrades,
    portfolioUpgrades,
    downgrades,
    uninstalls,
    managedClients,
    newVipClients,
    transferredClients,
    newIssues,
    recoveredClients,
    tasksCreated,
    openTasks,
    automaticTasks: tasksCreated.filter((task) => task.source === 'AUTO'),
    manualTasks: tasksCreated.filter((task) => task.source !== 'AUTO'),
  };

  const kpis: Partial<Record<AnalyticsMetricKey, KpiValue>> = {
    meetingsCompleted: count(meetingsCompleted),
    reviewsAcquired: count(reviewsAcquired),
    issuesResolved: count(issuesResolved),
    tasksCompleted: count(tasksCompleted),
    clientsContacted: count(clientsContacted),
    contactCoverage: rate(coveredClients.length, managedClients.length),
    bcInteractions: count(bcInteractions),
    followUpsCompleted: count(followUpsCompleted),
    upsellOpportunities: count(upsellOpportunities),
    bcInfluencedUpgrades: count(bcInfluencedUpgrades),
    portfolioUpgrades: count(portfolioUpgrades),
    upsellConversionRate: rate(
      convertedOpportunities.length,
      upsellOpportunities.length,
    ),
    downgrades: count(downgrades),
    uninstalls: count(uninstalls),
    managedClients: count(managedClients),
    newVipClients: count(newVipClients),
    transferredClients: count(transferredClients),
    newIssues: count(newIssues),
    recoveredClients: count(recoveredClients),
    tasksCreated: count(tasksCreated),
    openTasks: count(openTasks),
    automaticTasks: count(records.automaticTasks),
    manualTasks: count(records.manualTasks),
  };

  const trend = buildTrendBuckets(period).map((bucket) => {
    const inBucket = (activity: BcActivityRecord) =>
      isInPeriod(activity.occurredAt, bucket);

    return {
      label: bucket.label,
      start: bucket.start,
      interactions: bcInteractions.filter(inBucket).length,
      meetings: meetingsCompleted.filter(inBucket).length,
    };
  });

  const statusAtEnd = new Map(
    managedClients.map((client) => [
      client.id,
      readStatusAt(client, dataset.statusChanges, endTime),
    ]),
  );
  const statusSnapshot = STATUS_ORDER.map((status) => ({
    status,
    count: managedClients.filter(
      (client) => statusAtEnd.get(client.id) === status,
    ).length,
  }));

  const tasksByCategory = CATEGORY_ORDER.map((category) => {
    const inCategory = tasksCreated.filter(
      (task) => task.category === category,
    );

    return {
      category,
      count: inCategory.length,
      customLabels: [
        ...new Set(
          inCategory.flatMap((task) =>
            category === 'OTHER' &&
            typeof task.customCategory === 'string' &&
            task.customCategory.length > 0
              ? [task.customCategory]
              : [],
          ),
        ),
      ],
    };
  });

  const outcomeCounts = new Map<string, number>();

  for (const task of tasksCreated) {
    if (task.outcomeStatus !== null) {
      outcomeCounts.set(
        task.outcomeStatus,
        (outcomeCounts.get(task.outcomeStatus) ?? 0) + 1,
      );
    }
  }

  return {
    records,
    kpis,
    portfolioClientIds,
    trend,
    statusSnapshot,
    tasksByCategory,
    taskOutcomes: [...outcomeCounts.entries()].map(
      ([outcomeStatus, total]) => ({
        outcomeStatus,
        count: total,
      }),
    ),
  };
};

export const readClientName = (
  clientById: Map<string, VipClientRecord>,
  vipClientId: string | null,
): string => {
  if (vipClientId === null) {
    return '—';
  }

  const client = clientById.get(vipClientId);

  return client?.name ?? client?.shopDomain ?? '—';
};
