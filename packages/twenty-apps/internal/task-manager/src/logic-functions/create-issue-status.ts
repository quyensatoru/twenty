import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_STATUS_SELECTION } from '../constants/record-selections';
import { CREATE_ISSUE_STATUS_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_ISSUE_STATUS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { readNewIssueStatusInput } from '../utils/read-new-issue-status-input.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
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
    const { name, category, color } = readNewIssueStatusInput(
      event.body ?? {},
    );

    // A new status is a new column on everyone's board, so it is a view edit
    // like reordering the columns: the role's "Manage Views" decides, not a
    // write grant on the app. Seeing the project is still required.
    if (!scope.canManageViews) {
      throw new AppScopePermissionDeniedError();
    }

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    // Written in the same mutation that creates the row: a row-level
    // predicate reads this mirror, so a row that lands without it is
    // invisible to every scoped member until a backfill runs.
    const appId = await resolveEffectiveAppId({
      client,
      objectNameSingular: 'issueStatus',
      immediateForeignKeyValue: projectId,
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
            appId,
            position: nextPosition + 1,
            color,
            category,
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
