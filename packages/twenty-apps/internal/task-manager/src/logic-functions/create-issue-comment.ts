import { randomUUID } from 'node:crypto';
import { isNonEmptyString } from '@sniptt/guards';

import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_COMMENT_SELECTION } from '../constants/record-selections';
import { CREATE_ISSUE_COMMENT_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';
import {
  createDiscussionRowOnce,
  type DiscussionComment,
  listDiscussionMembers,
  notifyDiscussionRecipients,
  readDiscussionBody,
  readDiscussionComment,
  requireDiscussionMember,
} from './utils/discussion-storage.util';
import { getDevelopmentRecordId } from './utils/upsert-development-links.util';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';

type CreateIssueCommentBody = {
  issueId?: string;
  requestId?: string;
  mentionMemberIds?: string[];
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

    const authorId = requireDiscussionMember(scope);
    if (appId === null) throw new AppScopePermissionDeniedError();
    const markdown = readDiscussionBody(event.body?.bodyV2);
    const requestId = event.body?.requestId ?? randomUUID();
    if (!isNonEmptyString(requestId) || requestId.length > 128)
      throw new Error('Invalid requestId.');
    const mentionMemberIds = event.body?.mentionMemberIds ?? [];
    if (
      !Array.isArray(mentionMemberIds) ||
      mentionMemberIds.length > 100 ||
      mentionMemberIds.some((id) => !isNonEmptyString(id))
    )
      throw new Error('Invalid mentions.');
    const members = await listDiscussionMembers(client, appId);
    const memberIds = new Set(members.map((member) => member.id));
    if (mentionMemberIds.some((id) => !memberIds.has(id)))
      throw new AppScopePermissionDeniedError();
    const parentCommentId = event.body?.parentCommentId;
    const parent =
      parentCommentId == null
        ? null
        : await readDiscussionComment(client, issueId, parentCommentId);
    if (parent?.parentCommentId != null)
      throw new Error('Reply to the original message instead.');
    const comment = await createDiscussionRowOnce<DiscussionComment>({
      client,
      singularName: 'issueComment',
      pluralName: 'issueComments',
      data: {
        id: getDevelopmentRecordId([
          'discussion-comment',
          issueId,
          authorId,
          requestId,
        ]),
        issueId,
        appId,
        authorId,
        requestId,
        mentionMemberIds: [...new Set(mentionMemberIds)],
        bodyV2: buildRichTextValue(markdown),
        parentCommentId: parentCommentId ?? null,
      },
      selection: ISSUE_COMMENT_SELECTION,
    });
    const savedParent =
      comment.parentCommentId == null
        ? null
        : await readDiscussionComment(client, issueId, comment.parentCommentId);
    await notifyDiscussionRecipients({
      client,
      scope,
      appId,
      comment,
      recipients: [
        ...(comment.mentionMemberIds ?? []),
        ...(savedParent?.authorId == null ? [] : [savedParent.authorId]),
      ],
    });
    return { issueComment: comment };
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
