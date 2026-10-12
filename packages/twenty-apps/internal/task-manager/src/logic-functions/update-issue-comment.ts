import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_COMMENT_SELECTION } from '../constants/record-selections';
import { UPDATE_ISSUE_COMMENT_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { canActOnIssueComment } from '../utils/can-act-on-issue-comment.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';
import { readDiscussionBody } from './utils/discussion-storage.util';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';

type UpdateIssueCommentBody = {
  issueCommentId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<UpdateIssueCommentBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueCommentId = requireString(
      event.body?.issueCommentId,
      'issueCommentId',
    );
    const input = event.body?.data ?? {};
    if (Object.keys(input).some((key) => key !== 'bodyV2'))
      throw new Error('Only the message body can be edited.');
    const data = {
      bodyV2: buildRichTextValue(readDiscussionBody(input.bodyV2)),
    };

    // Authorship outlives the grant that made the comment possible, so the
    // comment the caller is editing has to be in scope on its own.
    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issueComment',
      recordId: issueCommentId,
      operation: 'write',
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

    const result = await client.mutation({
      updateIssueComment: {
        __args: { id: issueCommentId, data },
        ...ISSUE_COMMENT_SELECTION,
      },
    });

    return { issueComment: result?.updateIssueComment };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID,
  name: 'update-issue-comment',
  description: 'Route: edits a comment, restricted to its author.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_ISSUE_COMMENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
