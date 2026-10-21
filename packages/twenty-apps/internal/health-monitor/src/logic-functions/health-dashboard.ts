import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RETENTION_HOUR_OPTIONS } from '../constants/health-options';
import { HEALTH_DASHBOARD_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_DASHBOARD_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type HealthSnapshotRow } from '../types/health-dashboard';
import { buildHealthDashboard } from '../utils/build-health-dashboard.util';
import { buildAppOverviews } from './utils/build-app-overview.util';
import { listHealthIncidents } from './utils/health-incident-store.util';
import { listAllRecords } from './utils/list-all-records.util';
import { listApps } from './utils/list-apps.util';
import { loadScopedMonitor } from './utils/load-scoped-monitor.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DashboardBody = { monitorId?: string; rangeHours?: number };

const ALLOWED_RANGES = [1, ...RETENTION_HOUR_OPTIONS];

const handler = async (event: RoutePayload<DashboardBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const monitor = await loadScopedMonitor({
      client,
      scope,
      monitorId: requireString(event.body?.monitorId, 'monitorId'),
      operation: 'read',
    });
    const requested = Number(event.body?.rangeHours);
    const rangeHours = Math.min(
      ALLOWED_RANGES.includes(requested) ? requested : 24,
      Math.max(
        ...ALLOWED_RANGES.filter(
          (range) => range <= monitor.snapshotRetentionHours,
        ),
      ),
    );
    const now = new Date().toISOString();
    const since = new Date(
      Date.parse(now) - rangeHours * 3_600_000,
    ).toISOString();

    const [snapshots, incidents, apps] = await Promise.all([
      listAllRecords<HealthSnapshotRow>({
        client,
        pluralName: 'healthSnapshots',
        filter: { monitorId: { eq: monitor.id }, polledAt: { gte: since } },
        selection: {
          polledAt: true,
          status: true,
          latencyMs: true,
          metrics: true,
        },
        orderBy: [{ polledAt: 'AscNullsLast' }],
        maxRecords: 12_000,
      }),
      listHealthIncidents({
        client,
        filter: {
          monitorId: { eq: monitor.id },
          or: [
            { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
            { resolvedAt: { gte: since } },
          ],
        },
        orderBy: [{ openedAt: 'DescNullsLast' }],
        maxRecords: 300,
      }),
      monitor.appId === null
        ? Promise.resolve([])
        : listApps(client, { id: { eq: monitor.appId } }),
    ]);

    const [app] = await buildAppOverviews({
      client,
      scope,
      apps:
        apps.length > 0
          ? apps
          : [{ id: monitor.appId ?? '', name: monitor.name }],
      monitors: [monitor],
    });

    return {
      app,
      dashboard: buildHealthDashboard({
        snapshots,
        rangeHours,
        now,
        rules: monitor.rules,
        mutedNodeKeys: monitor.mutedNodeKeys,
        nodeLabels: monitor.nodeLabels,
        incidents,
      }),
    };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_DASHBOARD_LOGIC_FUNCTION_UID,
  name: 'health-dashboard',
  description:
    'Route: charts, status strips, processes and incidents of one monitor over a time range.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: HEALTH_DASHBOARD_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
