import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { type HealthMonitorRecord } from '../../types/health-monitor-record';
import { findHealthMonitor } from './health-monitor-store.util';
import { canReadApp, canWriteApp } from './resolve-caller-scope.util';

export const loadScopedMonitor = async ({
  client,
  scope,
  monitorId,
  operation,
}: {
  client: ApiClient;
  scope: CallerScope;
  monitorId: string;
  operation: 'read' | 'write';
}): Promise<HealthMonitorRecord> => {
  const monitor = await findHealthMonitor({ client, monitorId });
  const allowed =
    operation === 'read'
      ? canReadApp(scope, monitor.appId)
      : canWriteApp(scope, monitor.appId);

  if (!allowed) {
    throw new Error('You have no access to the app of this monitor.');
  }

  return monitor;
};
