import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_CREATE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_CREATE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IssueCreateRequest } from '../types/dashboard';
import { loadScopedVipClient } from './utils/client-store.util';
import { assertCanEditClient } from './utils/dashboard-data.util';
import { openClientIssue } from './utils/issue-lifecycle.util';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';

const handler = async (event: RoutePayload<Partial<IssueCreateRequest>>) =>
  runBcRoute(async ({ client, scope }) => {
    const body = event.body ?? {};
    const vipClient = await loadScopedVipClient({
      client,
      scope,
      vipClientId: requireString(body.vipClientId, 'vipClientId'),
    });

    assertCanEditClient(scope, vipClient);

    const { issue, task } = await openClientIssue({
      client,
      vipClient,
      title: requireString(body.title, 'title'),
      summary:
        typeof body.summary === 'string' && body.summary.trim().length > 0
          ? body.summary.trim()
          : null,
      classification: null,
      appNames: Array.isArray(body.appNames)
        ? body.appNames.filter((name): name is string => typeof name === 'string')
        : [],
      source: 'MANUAL',
      actorMemberId: scope.workspaceMemberId,
    });

    return { issueId: issue.id, taskId: task.id };
  });

export default defineLogicFunction({
  universalIdentifier: ISSUE_CREATE_LOGIC_FUNCTION_UID,
  name: 'bc-issue-create',
  description:
    'Route: logs a client issue by hand, opens its follow-up task and puts the client At Risk.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ISSUE_CREATE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
