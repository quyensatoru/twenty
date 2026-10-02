import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SPRINT_SELECTION } from '../constants/record-selections';
import { UPDATE_SPRINT_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_SPRINT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { assertRelationTargetAppScope } from './app-scope/assert-relation-target-app-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateSprintBody = {
  sprintId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<UpdateSprintBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const sprintId = requireString(event.body?.sprintId, 'sprintId');
    const data = event.body?.data ?? {};

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'sprint',
      recordId: sprintId,
      operation: 'write',
    });

    const projectId =
      typeof data.projectId === 'string' ? data.projectId : undefined;

    if (projectId !== undefined) {
      await assertAppScopeWriteAccess({
        client,
        scope,
        objectNameSingular: 'sprint',
        foreignKeyValue: projectId,
      });

      // Reparenting can move the record between apps, and the predicate
      // reads the mirror, not the chain.
      data.appId = await resolveEffectiveAppId({
        client,
        objectNameSingular: 'sprint',
        immediateForeignKeyValue: projectId,
      });
    }

    if (typeof data.ownerId === 'string') {
      // ownerId can change without projectId in the same payload — fall back
      // to the record's current project so the guard still fires.
      const effectiveProjectId =
        projectId ??
        (await fetchRecordColumn(client, 'sprints', sprintId, 'projectId'));

      await assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'sprint',
        projectId: effectiveProjectId,
        targets: [
          {
            fieldName: 'ownerId',
            kind: 'workspaceMember',
            targetId: data.ownerId,
          },
        ],
      });
    }

    const result = await client.mutation({
      updateSprint: { __args: { id: sprintId, data }, ...SPRINT_SELECTION },
    });

    return { sprint: result?.updateSprint };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_SPRINT_LOGIC_FUNCTION_UID,
  name: 'update-sprint',
  description: 'Route: updates a sprint, re-checking app-scope on reassignment.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_SPRINT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
