import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { type HealthMonitorRecord } from '../../types/health-monitor-record';
import { type HealthAppOverview } from '../../types/health-route-results';
import { listHealthIncidents } from './health-incident-store.util';
import { type AppSummary } from './list-apps.util';
import { canConfigureMonitors } from './resolve-caller-scope.util';

export const buildAppOverviews = async ({
  client,
  scope,
  apps,
  monitors,
}: {
  client: ApiClient;
  scope: CallerScope;
  apps: AppSummary[];
  monitors: HealthMonitorRecord[];
}): Promise<HealthAppOverview[]> => {
  const monitorIds = monitors.map((monitor) => monitor.id);
  const openIncidents =
    monitorIds.length === 0
      ? []
      : await listHealthIncidents({
          client,
          filter: {
            monitorId: { in: monitorIds },
            status: { in: ['OPEN', 'ACKNOWLEDGED'] },
          },
        });

  return apps.map((app) => {
    const monitor = monitors.find((candidate) => candidate.appId === app.id);
    const incidents =
      monitor === undefined
        ? []
        : openIncidents.filter((incident) => incident.monitorId === monitor.id);
    const nodes = monitor?.lastSnapshot?.nodes ?? [];

    return {
      appId: app.id,
      appName: app.name,
      canConfigure: canConfigureMonitors(scope),
      monitor:
        monitor === undefined
          ? null
          : {
              id: monitor.id,
              isEnabled: monitor.isEnabled,
              endpointUrl: monitor.endpointUrl,
              intervalMinutes: monitor.intervalMinutes,
              snapshotRetentionHours: monitor.snapshotRetentionHours,
              lastStatus: monitor.lastStatus,
              lastPolledAt: monitor.lastPolledAt,
              lastLatencyMs: monitor.lastLatencyMs,
              lastError: monitor.lastError,
              nodeCount: nodes.length,
              processCount: nodes.reduce(
                (sum, node) => sum + node.processes.length,
                0,
              ),
              openIncidentCount: incidents.length,
              criticalIncidentCount: incidents.filter(
                (incident) => incident.severity === 'CRITICAL',
              ).length,
            },
    };
  });
};
