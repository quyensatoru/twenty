import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_COMMENT_SELECTION } from '../constants/record-selections';
import { CREATE_ISSUE_COMMENT_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateIssueCommentBody = {
  issueId?: string;
  parentCommentId?: string | null;
  bodyV2?: unknown;
};

// Scoped via `issue -> project` (two hops), walked inside
// assertAppScopeWriteAccess.
const handler = async (event: RoutePayload<CreateIssueCommentBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'issueComment',
      foreignKeyValue: issueId,
    });

    // Written in the same mutation that creates the row: a row-level
    // predicate reads this mirror, so a row that lands without it is
    // invisible to every scoped member until a backfill runs.
    const appId = await resolveEffectiveAppId({
      client,
      objectNameSingular: 'issueComment',
      immediateForeignKeyValue: issueId,
    });

    const result = await client.mutation({
      createIssueComment: {
        __args: {
          data: {
            issueId,
            appId,
            ...(event.body?.bodyV2 === undefined
              ? {}
              : { bodyV2: event.body.bodyV2 }),
            ...(event.body?.parentCommentId === undefined
              ? {}
              : { parentCommentId: event.body.parentCommentId }),
            ...(scope.workspaceMemberId === null
              ? {}
              : { authorId: scope.workspaceMemberId }),
          },
        },
        ...ISSUE_COMMENT_SELECTION,
      },
    });

    return { issueComment: result?.createIssueComment };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID,
  name: 'create-issue-comment',
  description: 'Route: posts a comment on an issue the caller may write.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CREATE_ISSUE_COMMENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
