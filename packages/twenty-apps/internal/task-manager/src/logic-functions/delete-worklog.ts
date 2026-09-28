import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DELETE_WORKLOG_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_WORKLOG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { recomputeIssueTimeTracking } from './utils/recompute-issue-time-tracking.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteWorklogBody = { worklogId?: string };

const handler = async (event: RoutePayload<DeleteWorklogBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const worklogId = requireString(event.body?.worklogId, 'worklogId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'worklog',
      recordId: worklogId,
      operation: 'softDelete',
    });

    const issueId = await fetchRecordColumn(
      client,
      'worklogs',
      worklogId,
      'issueId',
    );

    await client.mutation({
      deleteWorklog: { __args: { id: worklogId }, id: true },
    });

    await recomputeIssueTimeTracking({ client, issueIds: [issueId] });

    return { deletedWorklogId: worklogId };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_WORKLOG_LOGIC_FUNCTION_UID,
  name: 'delete-worklog',
  description:
    'Route: deletes a worklog and recomputes its issue time tracking totals.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: DELETE_WORKLOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
