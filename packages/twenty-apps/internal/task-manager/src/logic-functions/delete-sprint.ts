import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DELETE_SPRINT_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_SPRINT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { clearIssueRelation } from './utils/clear-issue-relation.util';
import { fetchSprint } from './utils/fetch-sprint.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteSprintBody = { sprintId?: string };

// Only a sprint that never ran can go: an active or closed one is the history
// of what the team did. Its issues return to the backlog.
const handler = async (event: RoutePayload<DeleteSprintBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const sprintId = requireString(event.body?.sprintId, 'sprintId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'sprint',
      recordId: sprintId,
      operation: 'softDelete',
    });

    const sprint = await fetchSprint(client, sprintId);

    if (sprint === null) {
      throw new Error(`Sprint ${sprintId} not found`);
    }

    if ((sprint.state ?? 'FUTURE') !== 'FUTURE') {
      throw new Error('Only a future sprint can be deleted.');
    }

    const movedIssueCount = await clearIssueRelation({
      client,
      columnName: 'sprintId',
      recordId: sprintId,
    });

    await client.mutation({
      deleteSprint: { __args: { id: sprintId }, id: true },
    });

    return { deletedSprintId: sprintId, movedIssueCount };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_SPRINT_LOGIC_FUNCTION_UID,
  name: 'delete-sprint',
  description:
    'Route: deletes a future sprint and returns its issues to the backlog.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: DELETE_SPRINT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
