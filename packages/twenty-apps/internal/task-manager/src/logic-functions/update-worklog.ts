import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { WORKLOG_SELECTION } from '../constants/record-selections';
import { UPDATE_WORKLOG_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_WORKLOG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { recomputeIssueTimeTracking } from './utils/recompute-issue-time-tracking.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateWorklogBody = {
  worklogId?: string;
  data?: Record<string, unknown>;
};

// Unlike the fork's post-hook, which only ever saw the after-state and left a
// moved worklog's old issue stale, the previous issue is read before the write
// and recomputed alongside the new one.
const handler = async (event: RoutePayload<UpdateWorklogBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const worklogId = requireString(event.body?.worklogId, 'worklogId');
    const data = event.body?.data ?? {};

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'worklog',
      recordId: worklogId,
      operation: 'write',
    });

    if (typeof data.issueId === 'string') {
      await assertAppScopeWriteAccess({
        client,
        scope,
        objectNameSingular: 'worklog',
        foreignKeyValue: data.issueId,
      });

      // Reparenting can move the record between apps, and the predicate
      // reads the mirror, not the chain.
      data.appId = await resolveEffectiveAppId({
        client,
        objectNameSingular: 'worklog',
        immediateForeignKeyValue: data.issueId,
      });
    }

    const previousIssueId = await fetchRecordColumn(
      client,
      'worklogs',
      worklogId,
      'issueId',
    );

    const result = await client.mutation({
      updateWorklog: { __args: { id: worklogId, data }, ...WORKLOG_SELECTION },
    });

    await recomputeIssueTimeTracking({
      client,
      issueIds: [
        previousIssueId,
        typeof data.issueId === 'string' ? data.issueId : previousIssueId,
      ],
    });

    return { worklog: result?.updateWorklog };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_WORKLOG_LOGIC_FUNCTION_UID,
  name: 'update-worklog',
  description:
    'Route: edits a worklog and recomputes time tracking on both the old and new issue.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: UPDATE_WORKLOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
