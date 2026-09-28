import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PROJECT_SELECTION } from '../constants/record-selections';
import { UPDATE_PROJECT_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_PROJECT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateProjectBody = {
  projectId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<UpdateProjectBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const data = event.body?.data ?? {};

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'write',
    });

    // Reassigning the app is only re-validated when `appId` is actually part
    // of the payload; leaving it untouched never needs re-checking.
    if (typeof data.appId === 'string') {
      await assertAppScopeWriteAccess({
        client,
        scope,
        objectNameSingular: 'project',
        foreignKeyValue: data.appId,
      });
    }

    const result = await client.mutation({
      updateProject: {
        __args: { id: projectId, data },
        ...PROJECT_SELECTION,
      },
    });

    return { project: result?.updateProject };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_PROJECT_LOGIC_FUNCTION_UID,
  name: 'update-project',
  description: 'Route: updates a project, re-checking app-scope on reassignment.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_PROJECT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
