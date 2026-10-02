import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DELETE_ISSUE_COMMENT_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_ISSUE_COMMENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { canActOnIssueComment } from '../utils/can-act-on-issue-comment.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteIssueCommentBody = { issueCommentId?: string };

const handler = async (event: RoutePayload<DeleteIssueCommentBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueCommentId = requireString(
      event.body?.issueCommentId,
      'issueCommentId',
    );

    // Authorship alone is not enough: it outlives the grant that made the
    // comment possible, and it says nothing about soft-delete permission. The
    // fork had the ORM predicate underneath this check; here there is nothing
    // underneath it.
    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issueComment',
      recordId: issueCommentId,
      operation: 'softDelete',
    });

    const authorId = await fetchRecordColumn(
      client,
      'issueComments',
      issueCommentId,
      'authorId',
    );

    if (
      !canActOnIssueComment({
        commentAuthorId: authorId,
        callerWorkspaceMemberId: scope.workspaceMemberId,
        canBypassAppScope: scope.canBypassAppScope,
      })
    ) {
      throw new AppScopePermissionDeniedError();
    }

    await client.mutation({
      deleteIssueComment: { __args: { id: issueCommentId }, id: true },
    });

    return { deletedIssueCommentId: issueCommentId };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_ISSUE_COMMENT_LOGIC_FUNCTION_UID,
  name: 'delete-issue-comment',
  description: 'Route: deletes a comment, restricted to its author.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DELETE_ISSUE_COMMENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
