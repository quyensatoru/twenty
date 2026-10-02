import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { EPIC_SELECTION } from '../constants/record-selections';
import { UPDATE_EPIC_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_EPIC_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { assertRelationTargetAppScope } from './app-scope/assert-relation-target-app-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateEpicBody = {
  epicId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<UpdateEpicBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const epicId = requireString(event.body?.epicId, 'epicId');
    const data = event.body?.data ?? {};

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'epic',
      recordId: epicId,
      operation: 'write',
    });

    const projectId =
      typeof data.projectId === 'string' ? data.projectId : undefined;

    if (projectId !== undefined) {
      await assertAppScopeWriteAccess({
        client,
        scope,
        objectNameSingular: 'epic',
        foreignKeyValue: projectId,
      });

      // Reparenting can move the record between apps, and the predicate
      // reads the mirror, not the chain.
      data.appId = await resolveEffectiveAppId({
        client,
        objectNameSingular: 'epic',
        immediateForeignKeyValue: projectId,
      });
    }

    if (typeof data.assigneeId === 'string') {
      // assigneeId can change without projectId in the same payload — fall
      // back to the record's current project so the guard still fires.
      const effectiveProjectId =
        projectId ??
        (await fetchRecordColumn(client, 'epics', epicId, 'projectId'));

      await assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'epic',
        projectId: effectiveProjectId,
        targets: [
          {
            fieldName: 'assigneeId',
            kind: 'workspaceMember',
            targetId: data.assigneeId,
          },
        ],
      });
    }

    const result = await client.mutation({
      updateEpic: { __args: { id: epicId, data }, ...EPIC_SELECTION },
    });

    return { epic: result?.updateEpic };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_EPIC_LOGIC_FUNCTION_UID,
  name: 'update-epic',
  description: 'Route: updates an epic, re-checking app-scope on reassignment.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_EPIC_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
