import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DELETE_ISSUE_STATUS_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_ISSUE_STATUS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteIssueStatusBody = {
  issueStatusId?: string;
  // Where the issues currently in this column go. Omitted leaves them without
  // a status, which the board renders as an uncategorised column.
  fallbackIssueStatusId?: string | null;
};

const handler = async (event: RoutePayload<DeleteIssueStatusBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueStatusId = requireString(
      event.body?.issueStatusId,
      'issueStatusId',
    );
    const fallbackIssueStatusId = event.body?.fallbackIssueStatusId ?? null;

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issueStatus',
      recordId: issueStatusId,
      operation: 'softDelete',
    });

    // issue.status is SET_NULL on delete, but reassigning first keeps the
    // board from silently dropping a column's worth of issues into limbo.
    const issuesResult = await client.query({
      issues: {
        __args: { filter: { statusId: { eq: issueStatusId } }, first: 500 },
        edges: { node: { id: true } },
      },
    });

    const connection = issuesResult?.issues as
      | Connection<{ id: string }>
      | undefined;

    for (const edge of connection?.edges ?? []) {
      await client.mutation({
        updateIssue: {
          __args: {
            id: edge.node.id,
            data: { statusId: fallbackIssueStatusId },
          },
          id: true,
        },
      });
    }

    await client.mutation({
      deleteIssueStatus: { __args: { id: issueStatusId }, id: true },
    });

    return { deletedIssueStatusId: issueStatusId };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_ISSUE_STATUS_LOGIC_FUNCTION_UID,
  name: 'delete-issue-status',
  description:
    'Route: removes a status column and reassigns the issues that were in it.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: DELETE_ISSUE_STATUS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
