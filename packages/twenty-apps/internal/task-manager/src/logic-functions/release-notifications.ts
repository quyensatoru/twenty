import { defineLogicFunction } from 'twenty-sdk/define';

import {
  RELEASE_NOTIFICATION_SELECTION,
  RELEASE_NOTIFICATIONS_LOGIC_FUNCTION_UID,
  RELEASE_NOTIFICATIONS_ROUTE_PATH,
} from '../constants/release-notification';
import {
  type ReleaseNotification,
  type ReleaseNotificationApp,
} from '../types/release-notification';
import { listGrantedAppIds } from '../utils/list-granted-app-ids.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type AppNode = { id: string; name: string | null };

const handler = async () =>
  runScopedRoute(async ({ client, scope }) => {
    const readableAppIds = listGrantedAppIds(scope.grantsByAppId, 'read');

    const appNodes =
      !scope.canBypassAppScope && readableAppIds.length === 0
        ? []
        : await listScopedRecords<AppNode>({
            client,
            pluralName: 'apps',
            filter: scope.canBypassAppScope
              ? {}
              : { id: { in: readableAppIds } },
            selection: { id: true, name: true },
            orderBy: [{ name: 'AscNullsLast' }],
          });

    const apps: ReleaseNotificationApp[] = appNodes.map((app) => ({
      id: app.id,
      name: app.name ?? '',
      canWrite: hasAppGrant(scope, app.id, 'write'),
      canDelete: hasAppGrant(scope, app.id, 'softDelete'),
    }));

    const releases =
      apps.length === 0
        ? []
        : await listScopedRecords<ReleaseNotification>({
            client,
            pluralName: 'releaseNotifications',
            filter: { appId: { in: apps.map((app) => app.id) } },
            selection: RELEASE_NOTIFICATION_SELECTION,
            orderBy: [
              { releaseDate: 'DescNullsFirst' },
              { createdAt: 'DescNullsLast' },
            ],
          });

    return { apps, releases };
  });

export default defineLogicFunction({
  universalIdentifier: RELEASE_NOTIFICATIONS_LOGIC_FUNCTION_UID,
  name: 'release-notifications',
  description:
    'Route: apps the caller can read and their release notifications.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: RELEASE_NOTIFICATIONS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
