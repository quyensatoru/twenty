import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { WORKLOG_SELECTION } from '../constants/record-selections';
import { CREATE_WORKLOG_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_WORKLOG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { recomputeIssueTimeTracking } from './utils/recompute-issue-time-tracking.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateWorklogBody = {
  issueId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<CreateWorklogBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');
    const data: Record<string, unknown> = {
      ...(event.body?.data ?? {}),
      issueId,
    };

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'worklog',
      foreignKeyValue: issueId,
    });

    if (data.memberId === undefined && scope.workspaceMemberId !== null) {
      data.memberId = scope.workspaceMemberId;
    }

    const result = await client.mutation({
      createWorklog: { __args: { data }, ...WORKLOG_SELECTION },
    });

    await recomputeIssueTimeTracking({ client, issueIds: [issueId] });

    return { worklog: result?.createWorklog };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_WORKLOG_LOGIC_FUNCTION_UID,
  name: 'create-worklog',
  description:
    'Route: logs time on an issue and recomputes its time tracking totals.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CREATE_WORKLOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
