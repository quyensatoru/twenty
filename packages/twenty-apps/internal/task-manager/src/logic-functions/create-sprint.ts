import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SPRINT_SELECTION } from '../constants/record-selections';
import { CREATE_SPRINT_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_SPRINT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { assertRelationTargetAppScope } from './app-scope/assert-relation-target-app-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateSprintBody = {
  projectId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<CreateSprintBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const data: Record<string, unknown> = {
      ...(event.body?.data ?? {}),
      projectId,
    };

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'sprint',
      foreignKeyValue: projectId,
    });

    await assertRelationTargetAppScope({
      client,
      scope,
      objectNameSingular: 'sprint',
      projectId,
      targets:
        typeof data.ownerId === 'string'
          ? [
              {
                fieldName: 'ownerId',
                kind: 'workspaceMember',
                targetId: data.ownerId,
              },
            ]
          : [],
    });

    const result = await client.mutation({
      createSprint: { __args: { data }, ...SPRINT_SELECTION },
    });

    return { sprint: result?.createSprint };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_SPRINT_LOGIC_FUNCTION_UID,
  name: 'create-sprint',
  description: 'Route: creates a sprint inside a project the caller may write.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CREATE_SPRINT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
