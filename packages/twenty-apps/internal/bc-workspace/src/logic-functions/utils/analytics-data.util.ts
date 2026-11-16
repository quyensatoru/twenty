import {
  type AnalyticsPeriodInput,
  type AnalyticsPeriodPreset,
  type AnalyticsRequest,
  type ReportingPeriod,
} from '../../types/analytics';
import { type ApiClient } from '../../types/api-client';
import {
  type BcActivityRecord,
  type BcIssueRecord,
  type BcMemberRecord,
  type BcOpportunityRecord,
  type BcPaymentRecord,
  type BcPlanRecord,
  type BcReviewRecord,
  type BcSubscriptionEventRecord,
  type BcTaskRecord,
  type VipClientRecord,
  type WorkspaceMemberSummary,
} from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import {
  computeFinance,
  type FinanceComputation,
} from '../../utils/analytics-finance.util';
import {
  type AnalyticsComputation,
  type AnalyticsDataset,
  computeAnalytics,
} from '../../utils/analytics-metrics.util';
import { readFormerlyOwnedClientIds } from '../../utils/analytics-ownership.util';
import {
  ANALYTICS_PERIOD_PRESETS,
  resolveReportingPeriod,
} from '../../utils/analytics-period.util';
import {
  listByVipClientIds,
  listClientMerchants,
  listVisibleVipClients,
} from './client-store.util';
import { listAllRecords } from './list-all-records.util';
import { readBcSettings } from './read-bc-settings.util';
import {
  BC_ACTIVITY_SELECTION,
  BC_ISSUE_SELECTION,
  BC_OPPORTUNITY_SELECTION,
  BC_PAYMENT_SELECTION,
  BC_PLAN_SELECTION,
  BC_REVIEW_SELECTION,
  BC_SUBSCRIPTION_EVENT_SELECTION,
  BC_TASK_SELECTION,
  VIP_CLIENT_SELECTION,
} from './record-selections';
import { findFirstRecord } from './record-store.util';
import { BC_MEMBER_SELECTION } from './resolve-bc-scope.util';
import { listWorkspaceMembers } from './workspace-members.util';

const DAY_MS = 86_400_000;

export type AnalyticsContext = {
  request: AnalyticsRequest;
  period: ReportingPeriod;
  memberIds: string[] | null;
  dataset: AnalyticsDataset;
  computation: AnalyticsComputation;
  // Built only for callers allowed to see money.
  finance: FinanceComputation | null;
  clients: VipClientRecord[];
  workspaceMembers: WorkspaceMemberSummary[];
  teamMemberIds: string[] | null;
  baseCurrency: string;
};

const readPeriodInput = (value: unknown): AnalyticsPeriodInput => {
  if (typeof value === 'object' && value !== null) {
    const { preset, from, to } = value as Record<string, unknown>;

    if (typeof from === 'string' && typeof to === 'string') {
      return { from, to };
    }

    if (
      typeof preset === 'string' &&
      ANALYTICS_PERIOD_PRESETS.includes(preset as AnalyticsPeriodPreset)
    ) {
      return { preset: preset as AnalyticsPeriodPreset };
    }
  }

  return { preset: '30' };
};

export const readAnalyticsRequest = (body: unknown): AnalyticsRequest => {
  const record = (
    typeof body === 'object' && body !== null ? body : {}
  ) as Record<string, unknown>;

  return {
    view: record.view === 'TEAM' ? 'TEAM' : 'MY',
    period: readPeriodInput(record.period),
    appName:
      typeof record.appName === 'string' && record.appName.length > 0
        ? record.appName
        : null,
    memberId:
      typeof record.memberId === 'string' && record.memberId.length > 0
        ? record.memberId
        : null,
  };
};

// Who the numbers are about. Checked here, server side, so a BC cannot reach
// team or another BC's figures by editing the request.
export const resolveAnalyticsMembers = (
  scope: BcScope,
  request: AnalyticsRequest,
): string[] | null => {
  if (scope.role === 'NONE') {
    throw new Error('You are not in a BC team yet.');
  }

  if (request.view === 'MY') {
    if (scope.workspaceMemberId === null) {
      throw new Error('My analytics needs a workspace member.');
    }

    return [scope.workspaceMemberId];
  }

  if (scope.role !== 'MANAGER' && scope.role !== 'ADMIN') {
    throw new Error('Team analytics is only available to BC managers.');
  }

  if (request.memberId !== null) {
    if (
      scope.visibleMemberIds !== null &&
      !scope.visibleMemberIds.includes(request.memberId)
    ) {
      throw new Error('This BC is not in your team.');
    }

    return [request.memberId];
  }

  return scope.visibleMemberIds;
};

const memberFilter = (
  field: string,
  memberIds: string[] | null,
): Record<string, unknown> | null =>
  memberIds === null ? null : { [field]: { in: memberIds } };

const combine = (
  ...filters: (Record<string, unknown> | null)[]
): Record<string, unknown> => {
  const present = filters.filter(
    (filter): filter is Record<string, unknown> => filter !== null,
  );

  return present.length === 1 ? present[0] : { and: present };
};

export const loadAnalyticsContext = async ({
  client,
  scope,
  body,
  now = new Date().toISOString(),
}: {
  client: ApiClient;
  scope: BcScope;
  body: unknown;
  now?: string;
}): Promise<AnalyticsContext> => {
  const request = readAnalyticsRequest(body);
  const memberIds = resolveAnalyticsMembers(scope, request);
  const settings = readBcSettings();
  const period = resolveReportingPeriod({
    input: request.period,
    timezone: settings.reportingTimezone,
    now,
  });
  const attributionDays = Math.max(
    settings.upsellAttributionDays,
    settings.reviewAttributionDays,
  );
  const evidenceStart = new Date(
    Date.parse(period.start) - attributionDays * DAY_MS,
  ).toISOString();
  // Twenty takes one operator per field filter, so a range is an `and`.
  const inPeriod = (field: string) => ({
    and: [{ [field]: { gte: period.start } }, { [field]: { lt: period.end } }],
  });

  // Every PIC and status change before the end: ownership and status are
  // replayed as of any instant from these logs.
  const ownershipLog = await listAllRecords<BcActivityRecord>({
    client,
    pluralName: 'bcActivities',
    filter: {
      and: [
        { activityType: { in: ['PIC_CHANGE', 'STATUS_CHANGE'] } },
        { occurredAt: { lt: period.end } },
      ],
    },
    selection: BC_ACTIVITY_SELECTION,
    maxRecords: 100_000,
  });
  const picChanges = ownershipLog.filter(
    (activity) => activity.activityType === 'PIC_CHANGE',
  );
  const statusChanges = ownershipLog.filter(
    (activity) => activity.activityType === 'STATUS_CHANGE',
  );
  const attributionCorrections = (
    await listAllRecords<BcActivityRecord>({
      client,
      pluralName: 'bcActivities',
      filter: {
        and: [
          { activityType: { eq: 'SYSTEM' } },
          { metadata: { ilike: '%ATTRIBUTION%' } },
          { occurredAt: { lt: period.end } },
        ],
      },
      selection: BC_ACTIVITY_SELECTION,
      maxRecords: 10_000,
    })
  ).filter((activity) => activity.metadata?.correction === 'ATTRIBUTION');

  const visibleClients = await listVisibleVipClients(client, scope);
  const visibleIds = new Set(visibleClients.map((vipClient) => vipClient.id));
  // A client a member owned earlier stays in that member's past figures even
  // after it moved to a PIC outside the caller's scope.
  const formerIds = readFormerlyOwnedClientIds(picChanges, memberIds).filter(
    (vipClientId) => !visibleIds.has(vipClientId),
  );
  const formerClients =
    scope.visibleMemberIds === null || formerIds.length === 0
      ? []
      : await listAllRecords<VipClientRecord>({
          client,
          pluralName: 'vipClients',
          filter: { id: { in: formerIds } },
          selection: VIP_CLIENT_SELECTION,
        });
  const clients = [...visibleClients, ...formerClients];
  const clientIds =
    scope.visibleMemberIds === null
      ? null
      : clients.map((vipClient) => vipClient.id);

  const [
    merchants,
    activities,
    reviews,
    issues,
    tasks,
    opportunities,
    subscriptionEvents,
    workspaceMembers,
  ] = await Promise.all([
    listClientMerchants(client, clientIds),
    listAllRecords<BcActivityRecord>({
      client,
      pluralName: 'bcActivities',
      filter: combine(
        {
          and: [
            { occurredAt: { gte: evidenceStart } },
            { occurredAt: { lt: period.end } },
          ],
        },
        memberFilter('actorMemberId', memberIds),
      ),
      selection: BC_ACTIVITY_SELECTION,
      maxRecords: 50_000,
    }),
    listAllRecords<BcReviewRecord>({
      client,
      pluralName: 'bcReviews',
      filter: combine(
        inPeriod('publishedAt'),
        memberFilter('creditedMemberId', memberIds),
      ),
      selection: BC_REVIEW_SELECTION,
    }),
    listByVipClientIds<BcIssueRecord>({
      client,
      pluralName: 'bcIssues',
      vipClientIds: clientIds,
      selection: BC_ISSUE_SELECTION,
    }),
    listAllRecords<BcTaskRecord>({
      client,
      pluralName: 'bcTasks',
      filter: combine(
        { createdAt: { lt: period.end } },
        memberFilter('ownerId', memberIds),
      ),
      selection: BC_TASK_SELECTION,
      maxRecords: 50_000,
    }),
    listByVipClientIds<BcOpportunityRecord>({
      client,
      pluralName: 'bcOpportunities',
      vipClientIds: clientIds,
      selection: BC_OPPORTUNITY_SELECTION,
      extraFilter: inPeriod('createdAt'),
    }),
    listByVipClientIds<BcSubscriptionEventRecord>({
      client,
      pluralName: 'bcSubscriptionEvents',
      vipClientIds: clientIds,
      selection: BC_SUBSCRIPTION_EVENT_SELECTION,
      extraFilter: { occurredAt: { lt: period.end } },
    }),
    listWorkspaceMembers(client),
  ]);

  const dataset: AnalyticsDataset = {
    period,
    memberIds,
    appName: request.appName,
    clients,
    merchants,
    activities,
    reviews,
    issues,
    tasks,
    opportunities,
    subscriptionEvents,
    picChanges,
    statusChanges,
    attributionCorrections,
    upsellAttributionDays: settings.upsellAttributionDays,
  };
  const computation = computeAnalytics(dataset);

  let finance: FinanceComputation | null = null;

  if (scope.canSeeFinance) {
    const portfolioIds = [...computation.portfolioClientIds];
    const [plans, payments, anyPayment] = await Promise.all([
      listAllRecords<BcPlanRecord>({
        client,
        pluralName: 'bcPlans',
        selection: BC_PLAN_SELECTION,
      }),
      listByVipClientIds<BcPaymentRecord>({
        client,
        pluralName: 'bcPayments',
        vipClientIds: portfolioIds,
        selection: BC_PAYMENT_SELECTION,
        extraFilter: { paidAt: { lt: period.end } },
      }),
      findFirstRecord<{ id: string }>({
        client,
        objectNamePlural: 'bcPayments',
        filter: { id: { is: 'NOT_NULL' } },
        selection: { id: true },
      }),
    ]);

    finance = computeFinance({
      period,
      appName: request.appName,
      portfolioClients: computation.records.managedClients,
      merchants,
      plans,
      subscriptionEvents,
      payments,
      hasAnyPayment: anyPayment !== null,
    });
  }

  let teamMemberIds: string[] | null = null;

  if (request.view === 'TEAM' && request.memberId === null) {
    if (memberIds !== null) {
      teamMemberIds = memberIds;
    } else {
      const bcMembers = await listAllRecords<BcMemberRecord>({
        client,
        pluralName: 'bcMembers',
        filter: { isActive: { eq: true } },
        selection: BC_MEMBER_SELECTION,
      });

      teamMemberIds = [
        ...new Set(
          bcMembers.flatMap((member) =>
            member.memberId === null ? [] : [member.memberId],
          ),
        ),
      ];
    }
  }

  return {
    request,
    period,
    memberIds,
    dataset,
    computation,
    finance,
    clients,
    workspaceMembers,
    teamMemberIds,
    baseCurrency: settings.baseCurrency,
  };
};
