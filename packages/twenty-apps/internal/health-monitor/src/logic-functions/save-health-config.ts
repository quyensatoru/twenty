import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SAVE_HEALTH_CONFIG_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_SAVE_CONFIG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { normalizeHealthMonitorConfig } from '../utils/normalize-health-monitor-config.util';
import {
  listHealthMonitors,
  updateHealthMonitor,
} from './utils/health-monitor-store.util';
import { listApps } from './utils/list-apps.util';
import { assertCanConfigureMonitors } from './utils/resolve-caller-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type SaveBody = { appId?: string; config?: unknown };

const handler = async (event: RoutePayload<SaveBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const appId = requireString(event.body?.appId, 'appId');

    assertCanConfigureMonitors(scope);

    const config = normalizeHealthMonitorConfig(event.body?.config);
    const [[app], [existing]] = await Promise.all([
      listApps(client, { id: { eq: appId } }),
      listHealthMonitors({ client, filter: { appId: { eq: appId } } }),
    ]);

    if (app === undefined) {
      throw new Error('App not found.');
    }

    if (
      config.isEnabled &&
      config.headerValue === null &&
      (existing?.headerValue ?? '').length === 0
    ) {
      throw new Error('Enter the header value before enabling monitoring.');
    }

    const { headerValue, ...rest } = config;
    const data: Record<string, unknown> = {
      ...rest,
      name: `${app.name} health`,
      ...(headerValue === null ? {} : { headerValue }),
    };

    delete data.hasHeaderValue;

    if (existing === undefined) {
      const result = await client.mutation({
        createHealthMonitor: {
          __args: { data: { ...data, appId, headerValue: headerValue ?? '' } },
          id: true,
        },
      });

      return { monitorId: result?.createHealthMonitor?.id ?? null };
    }

    // Turning a monitor back on must not reuse the failure count of the old run.
    await updateHealthMonitor({
      client,
      monitorId: existing.id,
      data:
        existing.isEnabled || !config.isEnabled
          ? data
          : { ...data, consecutiveFailures: 0, lastPolledAt: null },
    });

    return { monitorId: existing.id };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_SAVE_CONFIG_LOGIC_FUNCTION_UID,
  name: 'save-health-config',
  description:
    "Route: creates or updates an app's monitor. Workspace admins only.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SAVE_HEALTH_CONFIG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
