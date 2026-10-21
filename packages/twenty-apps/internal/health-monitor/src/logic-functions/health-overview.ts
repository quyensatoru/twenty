import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { HEALTH_OVERVIEW_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_OVERVIEW_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildAppOverviews } from './utils/build-app-overview.util';
import { findDashboardPageLayoutId } from './utils/find-dashboard-url.util';
import { listHealthMonitors } from './utils/health-monitor-store.util';
import { listApps } from './utils/list-apps.util';
import { canReadApp } from './utils/resolve-caller-scope.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type OverviewBody = { appId?: string };

const handler = async (event: RoutePayload<OverviewBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const appId =
      typeof event.body?.appId === 'string' ? event.body.appId : null;
    const apps = (
      await listApps(client, appId === null ? undefined : { id: { eq: appId } })
    ).filter((app) => canReadApp(scope, app.id));
    const monitors =
      apps.length === 0
        ? []
        : await listHealthMonitors({
            client,
            filter: { appId: { in: apps.map((app) => app.id) } },
          });

    return {
      apps: await buildAppOverviews({ client, scope, apps, monitors }),
      dashboardPageLayoutId: await findDashboardPageLayoutId(),
    };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_OVERVIEW_LOGIC_FUNCTION_UID,
  name: 'health-overview',
  description:
    'Route: the apps the caller can see, each with its monitor status and open incident count.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: HEALTH_OVERVIEW_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
