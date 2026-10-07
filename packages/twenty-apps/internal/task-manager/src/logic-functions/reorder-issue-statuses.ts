import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { REORDER_ISSUE_STATUSES_ROUTE_PATH } from '../constants/route-paths';
import { REORDER_ISSUE_STATUSES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ReorderIssueStatusesBody = {
  projectId?: string;
  // Every status of the project, in the new column order.
  issueStatusIds?: unknown;
};

const readIssueStatusIds = (value: unknown): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((id): id is string => typeof id === 'string' && id !== '')
  ) {
    throw new Error('issueStatusIds must be a list of status ids.');
  }

  if (new Set(value).size !== value.length) {
    throw new Error('issueStatusIds must not repeat a status.');
  }

  return value;
};

// The board's column order is the statuses' `position`, the same for everyone
// on the project. The whole list is sent rather than one move, and it must be
// exactly the project's statuses: a board that went stale (a status added or
// removed elsewhere) is refused instead of writing an order built from columns
// it never saw.
const handler = async (event: RoutePayload<ReorderIssueStatusesBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const issueStatusIds = readIssueStatusIds(event.body?.issueStatusIds);

    // Reordering changes the board for everyone on the project, which makes
    // it a view edit: Twenty's own "Manage Views" role permission decides,
    // not a write grant on the app. Seeing the project is still required, so
    // the route cannot be pointed at a project the caller has no access to.
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

    const existing = await client.query({
      issueStatuses: {
        __args: { filter: { projectId: { eq: projectId } }, first: 200 },
        edges: { node: { id: true, position: true } },
      },
    });

    const currentStatuses = (
      (existing?.issueStatuses as
        | Connection<{ id: string; position?: number | null }>
        | undefined)?.edges ?? []
    ).map((edge) => edge.node);
    const currentIds = new Set(currentStatuses.map((status) => status.id));

    if (
      currentIds.size !== issueStatusIds.length ||
      !issueStatusIds.every((id) => currentIds.has(id))
    ) {
      throw new Error(
        'The statuses changed since the board was loaded. Reload and try again.',
      );
    }

    const positionById = new Map(
      currentStatuses.map((status) => [status.id, status.position ?? null]),
    );

    await Promise.all(
      issueStatusIds
        .map((id, position) => ({ id, position }))
        .filter(({ id, position }) => positionById.get(id) !== position)
        .map(({ id, position }) =>
          client.mutation({
            updateIssueStatus: {
              __args: { id, data: { position } },
              id: true,
            },
          }),
        ),
    );

    return {
      issueStatuses: issueStatusIds.map((id, position) => ({ id, position })),
    };
  });

export default defineLogicFunction({
  universalIdentifier: REORDER_ISSUE_STATUSES_LOGIC_FUNCTION_UID,
  name: 'reorder-issue-statuses',
  description:
    "Route: rewrites a project's status positions, which is the board's column order.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: REORDER_ISSUE_STATUSES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
