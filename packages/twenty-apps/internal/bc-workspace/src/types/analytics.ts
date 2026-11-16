import { type RelationshipStatus, type TaskCategory } from './bc-records';

export type AnalyticsView = 'MY' | 'TEAM';

export type AnalyticsPeriodPreset = '7' | '30' | '90' | '180' | '365';

export type AnalyticsPeriodInput =
  { preset: AnalyticsPeriodPreset } | { from: string; to: string };

export type AnalyticsRequest = {
  view: AnalyticsView;
  period: AnalyticsPeriodInput;
  appName: string | null;
  memberId: string | null;
};

// `start` is inclusive and `end` exclusive, both UTC instants of local
// midnights in the reporting timezone; fromDate/toDate are the inclusive
// local days the user picked.
export type ReportingPeriod = {
  start: string;
  end: string;
  fromDate: string;
  toDate: string;
  timezone: string;
  dayCount: number;
};

export type AnalyticsMetricKey =
  | 'meetingsCompleted'
  | 'reviewsAcquired'
  | 'issuesResolved'
  | 'tasksCompleted'
  | 'clientsContacted'
  | 'contactCoverage'
  | 'bcInteractions'
  | 'followUpsCompleted'
  | 'upsellOpportunities'
  | 'bcInfluencedUpgrades'
  | 'portfolioUpgrades'
  | 'upsellConversionRate'
  | 'downgrades'
  | 'uninstalls'
  | 'managedClients'
  | 'newVipClients'
  | 'transferredClients'
  | 'newIssues'
  | 'recoveredClients'
  | 'tasksCreated'
  | 'openTasks'
  | 'automaticTasks'
  | 'manualTasks'
  | 'totalMrr'
  | 'newMrr'
  | 'expansionMrr'
  | 'contractionMrr'
  | 'churnedMrr'
  | 'portfolioLifetimeRevenue'
  | 'averageLifetimeRevenue';

export type KpiValue = {
  value: number | null;
  // UNAVAILABLE: the data feed behind the metric is missing, never shown as 0.
  status: 'OK' | 'UNAVAILABLE';
  numerator?: number;
  denominator?: number;
};

export type AnalyticsTrendBucket = {
  label: string;
  start: string;
  interactions: number;
  meetings: number;
};

export type AnalyticsReviewRow = {
  id: string;
  clientName: string;
  vipClientId: string | null;
  appName: string | null;
  rating: number | null;
  publishedAt: string | null;
  creditedMemberName: string | null;
  reviewUrl: string | null;
};

export type AnalyticsTeamRow = {
  id: string;
  memberName: string;
  managedClients: number;
  clientsContacted: number;
  meetingsCompleted: number;
  reviewsAcquired: number;
  bcInfluencedUpgrades: number;
  issuesResolved: number;
  tasksCompleted: number;
  openTasks: number;
};

export type AnalyticsRevenueRow = {
  id: string;
  clientName: string;
  appNames: string[];
  picName: string | null;
  // null: no payment on record for this client while the feed is connected.
  lifetimeRevenue: number | null;
};

export type AnalyticsFinance = {
  currency: string;
  mrrStatus: 'OK' | 'UNAVAILABLE';
  lifetimeStatus: 'OK' | 'UNAVAILABLE';
  unpricedSubscriptionCount: number;
  clientsWithPayments: number;
  clientCount: number;
  revenueRows: AnalyticsRevenueRow[];
};

export type AnalyticsResult = {
  period: ReportingPeriod;
  view: AnalyticsView;
  appName: string | null;
  memberId: string | null;
  memberCount: number;
  kpis: Partial<Record<AnalyticsMetricKey, KpiValue>>;
  trend: AnalyticsTrendBucket[];
  statusSnapshot: { status: RelationshipStatus; count: number }[];
  tasksByCategory: {
    category: TaskCategory;
    count: number;
    customLabels: string[];
  }[];
  taskOutcomes: { outcomeStatus: string; count: number }[];
  reviews: AnalyticsReviewRow[];
  teamComparison: AnalyticsTeamRow[] | null;
  // Absent, not empty, for anyone who may not see financial figures.
  finance?: AnalyticsFinance;
};

export type DrilldownColumnKind =
  'text' | 'url' | 'date' | 'number' | 'currency' | 'link' | 'status' | 'app';

export type DrilldownColumn = {
  key: string;
  label: string;
  kind: DrilldownColumnKind;
  // Export name in constants/select-options.ts that labels a status cell.
  optionSet?: string;
};

export type DrilldownCellValue = string | number | boolean | null;

export type DrilldownRow = {
  id: string;
  vipClientId: string | null;
  cells: Record<string, DrilldownCellValue>;
};

export type DrilldownResult = {
  metricKey: AnalyticsMetricKey;
  columns: DrilldownColumn[];
  rows: DrilldownRow[];
  page: number;
  pageCount: number;
  total: number;
  // What the rows count: distinct clients or individual events.
  unit: 'clients' | 'events';
  note: string | null;
  search: string;
  // The order applied when the reader picked none, shown on its header.
  defaultSort: { key: string; direction: 'ASC' | 'DESC' };
};

export type DrilldownExport = {
  columns: DrilldownColumn[];
  rows: DrilldownRow[];
  isTruncated: boolean;
};
