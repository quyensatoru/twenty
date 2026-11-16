import {
  type AnalyticsMetricKey,
  type AnalyticsRequest,
  type AnalyticsResult,
  type AnalyticsTeamRow,
  type KpiValue,
  type ReportingPeriod,
} from '../types/analytics';
import { type VipClientRecord } from '../types/bc-records';
import { type FinanceComputation } from './analytics-finance.util';
import {
  type AnalyticsComputation,
  type AnalyticsDataset,
  computeAnalytics,
  readClientName,
} from './analytics-metrics.util';

const FINANCE_KEYS: AnalyticsMetricKey[] = [
  'totalMrr',
  'newMrr',
  'expansionMrr',
  'contractionMrr',
  'churnedMrr',
  'portfolioLifetimeRevenue',
  'averageLifetimeRevenue',
];

const readValue = (kpi: KpiValue | undefined): number => kpi?.value ?? 0;

export const buildTeamComparison = ({
  dataset,
  teamMemberIds,
  memberNames,
}: {
  dataset: AnalyticsDataset;
  teamMemberIds: string[];
  memberNames: Map<string, string>;
}): AnalyticsTeamRow[] =>
  teamMemberIds.map((memberId) => {
    const { kpis } = computeAnalytics({ ...dataset, memberIds: [memberId] });

    return {
      id: memberId,
      memberName: memberNames.get(memberId) ?? '—',
      managedClients: readValue(kpis.managedClients),
      clientsContacted: readValue(kpis.clientsContacted),
      meetingsCompleted: readValue(kpis.meetingsCompleted),
      reviewsAcquired: readValue(kpis.reviewsAcquired),
      bcInfluencedUpgrades: readValue(kpis.bcInfluencedUpgrades),
      issuesResolved: readValue(kpis.issuesResolved),
      tasksCompleted: readValue(kpis.tasksCompleted),
      openTasks: readValue(kpis.openTasks),
    };
  });

export const buildAnalyticsResult = ({
  request,
  period,
  memberIds,
  computation,
  finance,
  clients,
  memberNames,
  teamComparison,
  baseCurrency,
}: {
  request: AnalyticsRequest;
  period: ReportingPeriod;
  memberIds: string[] | null;
  computation: AnalyticsComputation;
  finance: FinanceComputation | null;
  clients: VipClientRecord[];
  memberNames: Map<string, string>;
  teamComparison: AnalyticsTeamRow[] | null;
  baseCurrency: string;
}): AnalyticsResult => {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const picNameOf = (client: VipClientRecord): string | null =>
    client.picId === null ? null : (memberNames.get(client.picId) ?? null);
  const kpis: AnalyticsResult['kpis'] = { ...computation.kpis };

  if (finance !== null) {
    for (const key of FINANCE_KEYS) {
      kpis[key] = finance.kpis[key];
    }
  }

  return {
    period,
    view: request.view,
    appName: request.appName,
    memberId: request.memberId,
    memberCount: memberIds === null ? -1 : memberIds.length,
    kpis,
    trend: computation.trend,
    statusSnapshot: computation.statusSnapshot,
    tasksByCategory: computation.tasksByCategory,
    taskOutcomes: computation.taskOutcomes,
    reviews: computation.records.reviewsAcquired.map((review) => ({
      id: review.id,
      clientName: readClientName(clientById, review.vipClientId),
      vipClientId: review.vipClientId,
      appName: review.appName,
      rating: review.rating,
      publishedAt: review.publishedAt,
      creditedMemberName:
        review.creditedMemberId === null
          ? null
          : (memberNames.get(review.creditedMemberId) ?? null),
      reviewUrl: review.reviewUrl,
    })),
    teamComparison,
    ...(finance === null
      ? {}
      : {
          finance: {
            currency: baseCurrency,
            mrrStatus: finance.mrrStatus,
            lifetimeStatus: finance.lifetimeStatus,
            unpricedSubscriptionCount: finance.unpricedSubscriptionCount,
            clientsWithPayments: finance.clientsWithPayments,
            clientCount: finance.revenueLines.length,
            revenueRows:
              finance.lifetimeStatus === 'OK'
                ? finance.revenueLines.map((line) => ({
                    id: line.client.id,
                    clientName:
                      line.client.name ?? line.client.shopDomain ?? '—',
                    appNames: line.appNames,
                    picName: picNameOf(line.client),
                    lifetimeRevenue: line.amount,
                  }))
                : [],
          },
        }),
  };
};
