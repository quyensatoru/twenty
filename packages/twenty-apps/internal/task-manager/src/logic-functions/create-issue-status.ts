import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_STATUS_SELECTION } from '../constants/record-selections';
import { CREATE_ISSUE_STATUS_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_ISSUE_STATUS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateIssueStatusBody = {
  projectId?: string;
  name?: string;
  color?: string;
  category?: string;
};

// The fork also appended a matching ViewGroup to the project's Kanban view.
// The shipped `By Status` Kanban groups on the status relation with no static
// groups, so a new status appears as a column on its own.
const handler = async (event: RoutePayload<CreateIssueStatusBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const name = requireString(event.body?.name, 'name');

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'issueStatus',
      foreignKeyValue: projectId,
    });

    const existing = await client.query({
      issueStatuses: {
        __args: { filter: { projectId: { eq: projectId } }, first: 200 },
        edges: { node: { id: true, position: true } },
      },
    });

    const connection = existing?.issueStatuses as
      | Connection<{ id: string; position?: number | null }>
      | undefined;
    const nextPosition = (connection?.edges ?? []).reduce(
      (max, edge) => Math.max(max, edge.node.position ?? -1),
      -1,
    );

    const result = await client.mutation({
      createIssueStatus: {
        __args: {
          data: {
            projectId,
            name,
            position: nextPosition + 1,
            ...(event.body?.color === undefined
              ? {}
              : { color: event.body.color }),
            ...(event.body?.category === undefined
              ? {}
              : { category: event.body.category }),
          },
        },
        ...ISSUE_STATUS_SELECTION,
      },
    });

    return { issueStatus: result?.createIssueStatus };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_ISSUE_STATUS_LOGIC_FUNCTION_UID,
  name: 'create-issue-status',
  description: 'Route: adds a status column to a project board.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CREATE_ISSUE_STATUS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
