import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  DELETE_RELEASE_NOTIFICATION_LOGIC_FUNCTION_UID,
  DELETE_RELEASE_NOTIFICATION_ROUTE_PATH,
} from '../constants/release-notification';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteReleaseNotificationBody = { releaseNotificationId?: string };

const handler = async (event: RoutePayload<DeleteReleaseNotificationBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const releaseNotificationId = requireString(
      event.body?.releaseNotificationId,
      'releaseNotificationId',
    );

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'releaseNotification',
      recordId: releaseNotificationId,
      operation: 'softDelete',
    });

    await client.mutation({
      deleteReleaseNotification: {
        __args: { id: releaseNotificationId },
        id: true,
      },
    });

    return { deletedReleaseNotificationId: releaseNotificationId };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_RELEASE_NOTIFICATION_LOGIC_FUNCTION_UID,
  name: 'delete-release-notification',
  description: 'Route: deletes a release notification.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DELETE_RELEASE_NOTIFICATION_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
