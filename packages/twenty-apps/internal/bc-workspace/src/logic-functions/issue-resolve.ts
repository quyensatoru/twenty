import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_RESOLVE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_RESOLVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { loadEditableIssue } from './utils/dashboard-issue-access.util';
import { closeClientIssue } from './utils/issue-lifecycle.util';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';

const handler = async (
  event: RoutePayload<{ issueId?: string; reason?: string }>,
) =>
  runBcRoute(async ({ client, scope }) => {
    const issue = await loadEditableIssue({
      client,
      scope,
      issueId: requireString(event.body?.issueId, 'issueId'),
    });
    const updated = await closeClientIssue({
      client,
      issue,
      action: 'RESOLVED',
      actorMemberId: scope.workspaceMemberId,
      reason: null,
    });

    return { issueId: updated.id, status: updated.status };
  });

export default defineLogicFunction({
  universalIdentifier: ISSUE_RESOLVE_LOGIC_FUNCTION_UID,
  name: 'bc-issue-resolve',
  description: 'Route: a BC confirms an issue is resolved; the client status is recomputed.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ISSUE_RESOLVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
