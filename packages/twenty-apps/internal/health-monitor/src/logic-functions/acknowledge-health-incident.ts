import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ACKNOWLEDGE_HEALTH_INCIDENT_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_ACKNOWLEDGE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { listHealthIncidents } from './utils/health-incident-store.util';
import { loadScopedMonitor } from './utils/load-scoped-monitor.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type AcknowledgeBody = { incidentId?: string };

// Acknowledging stops the reminders; an escalation to critical still emails.
const handler = async (event: RoutePayload<AcknowledgeBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const incidentId = requireString(event.body?.incidentId, 'incidentId');
    const [incident] = await listHealthIncidents({
      client,
      filter: { id: { eq: incidentId } },
    });

    if (incident === undefined || incident.monitorId === null) {
      throw new Error('Incident not found.');
    }

    await loadScopedMonitor({
      client,
      scope,
      monitorId: incident.monitorId,
      operation: 'read',
    });

    if (incident.status !== 'OPEN') {
      throw new Error('Only an open incident can be acknowledged.');
    }

    await client.mutation({
      updateHealthIncident: {
        __args: {
          id: incident.id,
          data: {
            status: 'ACKNOWLEDGED',
            acknowledgedByMemberId: scope.workspaceMemberId,
            acknowledgedAt: new Date().toISOString(),
          },
        },
        id: true,
      },
    });

    return { incidentId: incident.id };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_ACKNOWLEDGE_LOGIC_FUNCTION_UID,
  name: 'acknowledge-health-incident',
  description:
    'Route: marks an open incident as being handled, which stops its reminder emails.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ACKNOWLEDGE_HEALTH_INCIDENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
