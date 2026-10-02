import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { EPIC_SELECTION } from '../constants/record-selections';
import { CREATE_EPIC_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_EPIC_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { assertRelationTargetAppScope } from './app-scope/assert-relation-target-app-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateEpicBody = {
  projectId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<CreateEpicBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const data: Record<string, unknown> = {
      ...(event.body?.data ?? {}),
      projectId,
    };

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'epic',
      foreignKeyValue: projectId,
    });

    // Written in the same mutation that creates the row: a row-level
    // predicate reads this mirror, so a row that lands without it is
    // invisible to every scoped member until a backfill runs.
    data.appId = await resolveEffectiveAppId({
      client,
      objectNameSingular: 'epic',
      immediateForeignKeyValue: projectId,
    });

    await assertRelationTargetAppScope({
      client,
      scope,
      objectNameSingular: 'epic',
      projectId,
      targets:
        typeof data.assigneeId === 'string'
          ? [
              {
                fieldName: 'assigneeId',
                kind: 'workspaceMember',
                targetId: data.assigneeId,
              },
            ]
          : [],
    });

    const result = await client.mutation({
      createEpic: { __args: { data }, ...EPIC_SELECTION },
    });

    return { epic: result?.createEpic };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_EPIC_LOGIC_FUNCTION_UID,
  name: 'create-epic',
  description: 'Route: creates an epic inside a project the caller may write.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CREATE_EPIC_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
