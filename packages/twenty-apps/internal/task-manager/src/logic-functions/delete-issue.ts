import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DELETE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_ISSUE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteIssueBody = { issueId?: string };

// Soft delete, like every other delete route in this app: the row stays for
// history and the key is never reused. Children keep their parentId —
// clearing it would rewrite someone else's structure on a delete they did
// not ask for — and show as parentless until they are moved or deleted.
const handler = async (event: RoutePayload<DeleteIssueBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'softDelete',
    });

    await client.mutation({
      deleteIssue: { __args: { id: issueId }, id: true },
    });

    return { deletedIssueId: issueId };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_ISSUE_LOGIC_FUNCTION_UID,
  name: 'delete-issue',
  description: 'Route: soft-deletes an issue after an app-scope write check.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: DELETE_ISSUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
