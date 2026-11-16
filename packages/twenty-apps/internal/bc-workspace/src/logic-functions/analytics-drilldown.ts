import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ANALYTICS_DRILLDOWN_ROUTE_PATH } from '../constants/route-paths';
import { ANALYTICS_DRILLDOWN_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { METRIC_DEFINITIONS } from '../constants/metric-definitions';
import {
  type AnalyticsMetricKey,
  type DrilldownExport,
  type DrilldownResult,
} from '../types/analytics';
import {
  buildDrilldownTable,
  isFinanceMetric,
} from '../utils/analytics-drilldown.util';
import {
  paginate,
  readSortState,
  sortRecords,
} from '../utils/sort-records.util';
import { loadAnalyticsContext } from './utils/analytics-data.util';
import { assertCanSeeFinance } from './utils/resolve-bc-scope.util';
import { runBcRoute } from './utils/run-bc-route.util';
import { indexMemberNames } from './utils/workspace-members.util';

const PAGE_SIZE = 50;
const EXPORT_LIMIT = 5_000;

const readSearch = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase().slice(0, 100) : '';

const matchesSearch = (
  cells: Record<string, unknown>,
  search: string,
): boolean =>
  search.length === 0 ||
  Object.values(cells).some(
    (value) =>
      (typeof value === 'string' || typeof value === 'number') &&
      String(value).toLowerCase().includes(search),
  );

const readMetricKey = (value: unknown): AnalyticsMetricKey => {
  if (typeof value === 'string' && value in METRIC_DEFINITIONS) {
    return value as AnalyticsMetricKey;
  }

  throw new Error('Unknown metric.');
};

const handler = async (event: RoutePayload<Record<string, unknown>>) =>
  runBcRoute(async ({ client, scope }) => {
    const metricKey = readMetricKey(event.body?.metricKey);

    if (isFinanceMetric(metricKey)) {
      assertCanSeeFinance(scope);
    }

    const context = await loadAnalyticsContext({
      client,
      scope,
      body: event.body,
    });
    const table = buildDrilldownTable({
      metricKey,
      records: context.computation.records,
      finance: context.finance,
      clients: context.clients,
      memberNames: indexMemberNames(context.workspaceMembers),
      activities: context.dataset.activities,
    });
    const search = readSearch(event.body?.search);
    // Search and sort run over the whole set before paging or exporting.
    const sorted = sortRecords(
      table.rows.filter((row) => matchesSearch(row.cells, search)),
      readSortState(event.body?.sort),
      (row, key) => row.cells[key],
      table.defaultSort,
    );
    if (event.body?.exportAll === true) {
      const exported: DrilldownExport = {
        columns: table.columns,
        rows: sorted.slice(0, EXPORT_LIMIT),
        isTruncated: sorted.length > EXPORT_LIMIT,
      };

      return { export: exported };
    }

    const page = paginate(sorted, Number(event.body?.page ?? 1), PAGE_SIZE);
    const result: DrilldownResult = {
      metricKey,
      columns: table.columns,
      rows: page.items,
      page: page.page,
      pageCount: page.pageCount,
      total: page.total,
      unit: table.unit,
      note: table.note,
      search,
      defaultSort: table.defaultSort,
    };

    return { drilldown: result };
  });

export default defineLogicFunction({
  universalIdentifier: ANALYTICS_DRILLDOWN_LOGIC_FUNCTION_UID,
  name: 'bc-analytics-drilldown',
  description:
    'Route: the records behind one BC Analytics KPI, sorted over the full set before paging.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: ANALYTICS_DRILLDOWN_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
