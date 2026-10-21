import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CHECK_HEALTH_NOW_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_CHECK_NOW_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { findDashboardUrl } from './utils/find-dashboard-url.util';
import { listApps } from './utils/list-apps.util';
import { listWorkspaceMembers } from './utils/list-member-emails.util';
import { loadScopedMonitor } from './utils/load-scoped-monitor.util';
import { pollHealthMonitor } from './utils/poll-health-monitor.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CheckBody = { monitorId?: string };

const handler = async (event: RoutePayload<CheckBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const monitor = await loadScopedMonitor({
      client,
      scope,
      monitorId: requireString(event.body?.monitorId, 'monitorId'),
      operation: 'read',
    });
    const now = new Date().toISOString();

    if (
      monitor.pollLeaseUntil !== null &&
      Date.parse(monitor.pollLeaseUntil) > Date.parse(now)
    ) {
      throw new Error(
        'This monitor is being polled. Try again in a few seconds.',
      );
    }

    const [app] =
      monitor.appId === null
        ? []
        : await listApps(client, { id: { eq: monitor.appId } });

    return {
      summary: await pollHealthMonitor(monitor, {
        client,
        now,
        appName: app?.name ?? monitor.name,
        dashboardUrl: await findDashboardUrl(),
        loadMemberEmails: async () =>
          new Map(
            (await listWorkspaceMembers(client)).flatMap((member) =>
              member.email === null ? [] : [[member.id, member.email] as const],
            ),
          ),
      }),
    };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_CHECK_NOW_LOGIC_FUNCTION_UID,
  name: 'check-health-now',
  description:
    'Route: polls one monitor right away, with the same snapshot, incident and email handling as the cron.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CHECK_HEALTH_NOW_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
