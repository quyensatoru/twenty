import {
  type AnalyticsMetricKey,
  type DrilldownColumn,
  type DrilldownRow,
} from '../types/analytics';
import {
  type BcActivityRecord,
  type BcIssueRecord,
  type BcOpportunityRecord,
  type BcReviewRecord,
  type BcSubscriptionEventRecord,
  type BcTaskRecord,
  type VipClientRecord,
} from '../types/bc-records';
import {
  type FinanceComputation,
  type MrrMovementKind,
} from './analytics-finance.util';
import { type MetricRecords, readClientName } from './analytics-metrics.util';

export type DrilldownTable = {
  columns: DrilldownColumn[];
  rows: DrilldownRow[];
  unit: 'clients' | 'events';
  defaultSort: { key: string; direction: 'ASC' | 'DESC' };
  note: string | null;
};

type Names = {
  clientById: Map<string, VipClientRecord>;
  memberNames: Map<string, string>;
  activityById: Map<string, BcActivityRecord>;
};

// Why a record is (or is not) credited to a BC: the outreach that earned it.
const readEvidenceCells = (
  names: Names,
  activityIds: string[],
  reason: string | null,
) => {
  const activity = activityIds
    .map((activityId) => names.activityById.get(activityId))
    .find((candidate) => candidate !== undefined);

  return {
    evidence:
      activity === undefined
        ? activityIds.length > 0
          ? 'Outreach before the attribution window shown'
          : null
        : activity.title,
    evidenceDate: activity?.occurredAt ?? null,
    evidenceLink: activity?.sourceUrl ?? null,
    reason,
  };
};

const readAttributionEvidence = (
  event: BcSubscriptionEventRecord,
): { activityIds: string[]; reason: string | null } => {
  const evidence = event.attributionEvidence ?? {};
  const activityIds = Array.isArray(evidence.activityIds)
    ? evidence.activityIds.filter(
        (value): value is string => typeof value === 'string',
      )
    : [];
  const corrections = Array.isArray(evidence.corrections)
    ? evidence.corrections
    : [];
  const lastCorrection = corrections[corrections.length - 1] as
    { reason?: unknown } | undefined;

  // A manager correction overrides the automatic reason; its own words say why.
  if (lastCorrection !== undefined) {
    return {
      activityIds: [],
      reason:
        typeof lastCorrection.reason === 'string' &&
        lastCorrection.reason.length > 0
          ? lastCorrection.reason
          : 'Manual correction',
    };
  }

  return {
    activityIds,
    reason: typeof evidence.reason === 'string' ? evidence.reason : null,
  };
};

const column = (
  key: string,
  label: string,
  kind: DrilldownColumn['kind'] = 'text',
  optionSet?: string,
): DrilldownColumn =>
  optionSet === undefined
    ? { key, label, kind }
    : { key, label, kind, optionSet };

const evidenceColumns = [
  column('evidence', 'Evidence'),
  column('evidenceDate', 'Evidence date', 'date'),
  column('evidenceLink', 'Evidence link', 'url'),
  column('reason', 'Attribution'),
];

const memberName = (names: Names, memberId: string | null): string | null =>
  memberId === null ? null : (names.memberNames.get(memberId) ?? null);

const clientColumns = [
  column('client', 'Client'),
  column('domain', 'Shopify domain'),
  column('pic', 'PIC'),
  column('status', 'Client status', 'status', 'RELATIONSHIP_STATUS_OPTIONS'),
  column('lastContact', 'Last BC contact', 'date'),
];

const clientTable = (
  clients: VipClientRecord[],
  names: Names,
): DrilldownTable => ({
  columns: clientColumns,
  rows: clients.map((client) => ({
    id: client.id,
    vipClientId: client.id,
    cells: {
      client: client.name ?? client.shopDomain ?? '—',
      domain: client.shopDomain,
      pic: memberName(names, client.picId),
      status: client.relationshipStatus,
      lastContact: client.lastBcContactAt,
    },
  })),
  unit: 'clients',
  defaultSort: { key: 'client', direction: 'ASC' },
  note: null,
});

const activityTable = (
  activities: BcActivityRecord[],
  names: Names,
): DrilldownTable => ({
  columns: [
    column('date', 'Date', 'date'),
    column('client', 'Client'),
    column('type', 'Type', 'status', 'ACTIVITY_TYPE_OPTIONS'),
    column('title', 'Summary'),
    column('bc', 'BC'),
  ],
  rows: activities.map((activity) => ({
    id: activity.id,
    vipClientId: activity.vipClientId,
    cells: {
      date: activity.occurredAt,
      client: readClientName(names.clientById, activity.vipClientId),
      type: activity.activityType,
      title: activity.title,
      bc: memberName(names, activity.actorMemberId),
    },
  })),
  unit: 'events',
  defaultSort: { key: 'date', direction: 'DESC' },
  note: null,
});

const picChangeTable = (
  activities: BcActivityRecord[],
  names: Names,
): DrilldownTable => ({
  columns: [
    column('client', 'Client'),
    column('from', 'From PIC'),
    column('to', 'To PIC'),
    column('date', 'Assigned', 'date'),
  ],
  rows: activities.map((activity) => {
    const read = (key: string) => {
      const value = activity.metadata?.[key];

      return typeof value === 'string' ? value : null;
    };

    return {
      id: activity.id,
      vipClientId: activity.vipClientId,
      cells: {
        client: readClientName(names.clientById, activity.vipClientId),
        from: memberName(names, read('fromMemberId')),
        to: memberName(names, read('toMemberId')),
        date: activity.occurredAt,
      },
    };
  }),
  unit: 'clients',
  defaultSort: { key: 'date', direction: 'DESC' },
  note: null,
});

const reviewTable = (
  reviews: BcReviewRecord[],
  names: Names,
): DrilldownTable => ({
  columns: [
    column('client', 'Client'),
    column('app', 'App', 'app'),
    column('rating', 'Rating', 'number'),
    column('date', 'Review date', 'date'),
    column('bc', 'Credited BC'),
    column('link', 'Shopify review link', 'link'),
    ...evidenceColumns,
  ],
  rows: reviews.map((review) => ({
    id: review.id,
    vipClientId: review.vipClientId,
    cells: {
      client: readClientName(names.clientById, review.vipClientId),
      app: review.appName,
      rating: review.rating,
      date: review.publishedAt,
      bc: memberName(names, review.creditedMemberId),
      link: review.reviewUrl,
      ...readEvidenceCells(
        names,
        review.evidenceActivityId === null ? [] : [review.evidenceActivityId],
        review.evidenceActivityId === null
          ? 'No BC review request before publication'
          : 'BC review request before publication',
      ),
    },
  })),
  unit: 'events',
  defaultSort: { key: 'date', direction: 'DESC' },
  note: null,
});

const issueTable = (issues: BcIssueRecord[], names: Names): DrilldownTable => ({
  columns: [
    column('client', 'Client'),
    column('issue', 'Issue'),
    column('apps', 'Apps'),
    column('status', 'Status', 'status', 'ISSUE_STATUS_OPTIONS'),
    column('detected', 'Detected', 'date'),
    column('closed', 'Closed', 'date'),
    column('closedBy', 'Closed by'),
  ],
  rows: issues.map((issue) => ({
    id: issue.id,
    vipClientId: issue.vipClientId,
    cells: {
      client: readClientName(names.clientById, issue.vipClientId),
      issue: issue.title,
      apps: (issue.appNames ?? []).join(', '),
      status: issue.status,
      detected: issue.detectedAt ?? issue.createdAt,
      closed: issue.resolvedAt,
      closedBy: memberName(names, issue.resolvedByMemberId),
    },
  })),
  unit: 'events',
  defaultSort: { key: 'detected', direction: 'DESC' },
  note: null,
});

// Completion is its own column, separate from status: Cancelled, To Do and
// In Progress all read Not completed.
const taskTable = (tasks: BcTaskRecord[], names: Names): DrilldownTable => ({
  columns: [
    column('task', 'Task'),
    column('client', 'Client'),
    column('category', 'Category', 'status', 'TASK_CATEGORY_OPTIONS'),
    column('source', 'Source', 'status', 'TASK_SOURCE_OPTIONS'),
    column('priority', 'Priority', 'status', 'TASK_PRIORITY_OPTIONS'),
    column('status', 'Status', 'status', 'TASK_STATUS_OPTIONS'),
    column('completion', 'Completion'),
    column('owner', 'Owner'),
    column('created', 'Created', 'date'),
    column('completed', 'Completed at', 'date'),
  ],
  rows: tasks.map((task) => ({
    id: task.id,
    vipClientId: task.vipClientId,
    cells: {
      task: task.title,
      client: readClientName(names.clientById, task.vipClientId),
      category:
        task.category === 'OTHER' && task.customCategory
          ? task.customCategory
          : task.category,
      source: task.source,
      priority: task.priority,
      status: task.status,
      completion: task.status === 'COMPLETED' ? 'Completed' : 'Not completed',
      owner: memberName(names, task.ownerId),
      created: task.createdAt,
      completed: task.completedAt,
    },
  })),
  unit: 'events',
  defaultSort: { key: 'created', direction: 'DESC' },
  note: null,
});

const opportunityTable = (
  opportunities: BcOpportunityRecord[],
  names: Names,
  note: string | null,
): DrilldownTable => ({
  columns: [
    column('client', 'Client'),
    column('app', 'App', 'app'),
    column('plan', 'Plan'),
    column('cycle', 'Billing cycle'),
    column('usage', 'Usage %', 'number'),
    column('status', 'Status', 'status', 'OPPORTUNITY_STATUS_OPTIONS'),
    column('created', 'Created', 'date'),
  ],
  rows: opportunities.map((opportunity) => ({
    id: opportunity.id,
    vipClientId: opportunity.vipClientId,
    cells: {
      client: readClientName(names.clientById, opportunity.vipClientId),
      app: opportunity.appName,
      plan: opportunity.planCode,
      cycle: opportunity.billingCycle,
      usage: opportunity.usagePercent,
      status: opportunity.status,
      created: opportunity.createdAt,
    },
  })),
  unit: 'events',
  defaultSort: { key: 'created', direction: 'DESC' },
  note,
});

const subscriptionTable = (
  events: BcSubscriptionEventRecord[],
  names: Names,
  canSeeFinance: boolean,
  note: string | null,
  withEvidence = false,
): DrilldownTable => ({
  columns: [
    column('date', 'Date', 'date'),
    column('client', 'Client'),
    column('app', 'App', 'app'),
    column('event', 'Event', 'status', 'SUBSCRIPTION_EVENT_TYPE_OPTIONS'),
    column('from', 'From plan'),
    column('to', 'To plan'),
    column('influenced', 'BC influenced'),
    column('bc', 'Credited BC'),
    ...(canSeeFinance ? [column('mrr', 'MRR change', 'currency')] : []),
    ...(withEvidence ? evidenceColumns : []),
  ],
  rows: events.map((event) => {
    const { activityIds, reason } = readAttributionEvidence(event);

    return {
      id: event.id,
      vipClientId: event.vipClientId,
      cells: {
        date: event.occurredAt,
        client: readClientName(names.clientById, event.vipClientId),
        app: event.appName,
        event: event.eventType,
        from: event.oldPlan,
        to: event.newPlan,
        influenced: event.isBcInfluenced ? 'Yes' : 'No',
        bc: memberName(names, event.attributedMemberId),
        ...(canSeeFinance ? { mrr: event.mrrDelta } : {}),
        ...(withEvidence ? readEvidenceCells(names, activityIds, reason) : {}),
      },
    };
  }),
  unit: 'events',
  defaultSort: { key: 'date', direction: 'DESC' },
  note,
});

const movementTable = (
  finance: FinanceComputation,
  kind: MrrMovementKind,
  names: Names,
): DrilldownTable => ({
  ...subscriptionTable(
    finance.movements
      .filter((movement) => movement.kind === kind)
      .map((movement) => movement.event),
    names,
    true,
    null,
  ),
});

const unavailableTable = (note: string): DrilldownTable => ({
  columns: [],
  rows: [],
  unit: 'events',
  defaultSort: { key: 'id', direction: 'ASC' },
  note,
});

const FINANCE_METRICS: AnalyticsMetricKey[] = [
  'totalMrr',
  'newMrr',
  'expansionMrr',
  'contractionMrr',
  'churnedMrr',
  'portfolioLifetimeRevenue',
  'averageLifetimeRevenue',
];

export const isFinanceMetric = (metricKey: AnalyticsMetricKey): boolean =>
  FINANCE_METRICS.includes(metricKey);

export const buildDrilldownTable = ({
  metricKey,
  records,
  finance,
  clients,
  memberNames,
  activities,
}: {
  metricKey: AnalyticsMetricKey;
  records: MetricRecords;
  finance: FinanceComputation | null;
  clients: VipClientRecord[];
  memberNames: Map<string, string>;
  activities: BcActivityRecord[];
}): DrilldownTable => {
  const names: Names = {
    clientById: new Map(clients.map((client) => [client.id, client])),
    memberNames,
    activityById: new Map(
      activities.map((activity) => [activity.id, activity]),
    ),
  };
  const canSeeFinance = finance !== null;

  switch (metricKey) {
    case 'meetingsCompleted':
    case 'bcInteractions':
      return activityTable(records[metricKey], names);
    case 'clientsContacted':
      return clientTable(records.clientsContacted, names);
    case 'contactCoverage':
      return {
        ...clientTable(records.coveredClients, names),
        note: 'Managed clients at the period end who received BC contact during the period.',
      };
    case 'managedClients':
    case 'recoveredClients':
      return clientTable(records[metricKey], names);
    case 'newVipClients':
    case 'transferredClients':
      return picChangeTable(records[metricKey], names);
    case 'reviewsAcquired':
      return reviewTable(records.reviewsAcquired, names);
    case 'issuesResolved':
    case 'newIssues':
      return issueTable(records[metricKey], names);
    case 'tasksCompleted':
    case 'followUpsCompleted':
    case 'tasksCreated':
    case 'openTasks':
    case 'automaticTasks':
    case 'manualTasks':
      return taskTable(records[metricKey], names);
    case 'upsellOpportunities':
      return opportunityTable(records.upsellOpportunities, names, null);
    case 'upsellConversionRate':
      return opportunityTable(
        records.upsellOpportunities,
        names,
        'Cohort: opportunities created in the selected period. Converted ones count toward the rate.',
      );
    case 'bcInfluencedUpgrades':
      return subscriptionTable(
        records.bcInfluencedUpgrades,
        names,
        canSeeFinance,
        null,
        true,
      );
    case 'portfolioUpgrades':
      return subscriptionTable(
        records.portfolioUpgrades,
        names,
        canSeeFinance,
        'Every verified upgrade of the portfolio, whether a BC was involved or not.',
        true,
      );
    case 'downgrades':
    case 'uninstalls':
      return subscriptionTable(records[metricKey], names, canSeeFinance, null);
    default:
      break;
  }

  if (finance === null) {
    throw new Error('Financial data is only available to BC managers.');
  }

  switch (metricKey) {
    case 'totalMrr':
      return finance.mrrStatus === 'UNAVAILABLE'
        ? unavailableTable(
            'Unavailable: no plan prices are set in the App Plans catalog.',
          )
        : {
            columns: [
              column('client', 'Client'),
              column('app', 'App', 'app'),
              column('plan', 'Plan at period end'),
              column('price', 'Monthly price', 'currency'),
            ],
            rows: finance.mrrLines.map((line) => ({
              id: line.merchant.id,
              vipClientId: line.merchant.vipClientId,
              cells: {
                client: readClientName(
                  names.clientById,
                  line.merchant.vipClientId,
                ),
                app: line.merchant.app?.name ?? null,
                plan: line.planCode,
                price: line.monthlyPrice,
              },
            })),
            unit: 'events',
            defaultSort: { key: 'price', direction: 'DESC' },
            note:
              finance.unpricedSubscriptionCount > 0
                ? `${finance.unpricedSubscriptionCount} active subscriptions have a plan without a price and are left out.`
                : null,
          };
    case 'newMrr':
      return movementTable(finance, 'NEW', names);
    case 'expansionMrr':
      return movementTable(finance, 'EXPANSION', names);
    case 'contractionMrr':
      return movementTable(finance, 'CONTRACTION', names);
    case 'churnedMrr':
      return movementTable(finance, 'CHURNED', names);
    case 'portfolioLifetimeRevenue':
    case 'averageLifetimeRevenue':
      return finance.lifetimeStatus === 'UNAVAILABLE'
        ? unavailableTable('Unavailable: no payment feed is connected yet.')
        : {
            columns: [
              column('client', 'Client'),
              column('apps', 'Apps'),
              column('pic', 'PIC'),
              column('amount', 'Lifetime revenue', 'currency'),
            ],
            rows: finance.revenueLines.map((line) => ({
              id: line.client.id,
              vipClientId: line.client.id,
              cells: {
                client: line.client.name ?? line.client.shopDomain ?? '—',
                apps: line.appNames.join(', '),
                pic: memberName(names, line.client.picId),
                amount: line.amount,
              },
            })),
            unit: 'clients',
            defaultSort: { key: 'amount', direction: 'DESC' },
            note: 'Each amount covers every app of the client, even under a product filter. An empty amount means no payment is on record for that client.',
          };
    default:
      throw new Error('Unknown metric.');
  }
};
