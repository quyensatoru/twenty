import { defineLogicFunction } from 'twenty-sdk/define';

import { HEALTH_CLEANUP_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import { listHealthMonitors } from './utils/health-monitor-store.util';
import { readErrorMessage } from './utils/read-error-message.util';

const RESOLVED_INCIDENT_RETENTION_DAYS = 90;

const handler = async () => {
  const client = createAppClient();
  const nowMs = Date.now();
  const monitors = await listHealthMonitors({ client });
  const errors: string[] = [];

  for (const monitor of monitors) {
    try {
      await client.mutation({
        destroyHealthSnapshots: {
          __args: {
            filter: {
              monitorId: { eq: monitor.id },
              polledAt: {
                lt: new Date(
                  nowMs - monitor.snapshotRetentionHours * 3_600_000,
                ).toISOString(),
              },
            },
          },
          id: true,
        },
      });
    } catch (error) {
      errors.push(`${monitor.id}: ${readErrorMessage(error)}`);
    }
  }

  await client.mutation({
    destroyHealthIncidents: {
      __args: {
        filter: {
          status: { eq: 'RESOLVED' },
          resolvedAt: {
            lt: new Date(
              nowMs - RESOLVED_INCIDENT_RETENTION_DAYS * 86_400_000,
            ).toISOString(),
          },
        },
      },
      id: true,
    },
  });

  return { monitors: monitors.length, errors };
};

export default defineLogicFunction({
  universalIdentifier: HEALTH_CLEANUP_LOGIC_FUNCTION_UID,
  name: 'cleanup-health-snapshots',
  description:
    "Hourly: destroys snapshots older than each monitor's retention and resolved incidents older than 90 days.",
  timeoutSeconds: 300,
  cronTriggerSettings: {
    pattern: '7 * * * *',
  },
  handler,
});
