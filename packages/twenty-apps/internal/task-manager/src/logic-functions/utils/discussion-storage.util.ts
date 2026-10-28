import { isNonEmptyString, isObject } from '@sniptt/guards';

import { parseAppAccessPermissions } from '../../utils/parse-app-access-permissions.util';
import { ISSUE_COMMENT_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { readRichTextPlainValue } from '../../utils/read-rich-text-plain-value.util';
import { AppScopePermissionDeniedError } from '../app-scope/app-scope-error';
import { assertRecordInScope } from '../app-scope/assert-record-in-scope.util';
import { buildIssueCommentEmail, type NotificationIssue } from './build-notification-email.util';
import { listScopedRecords } from './list-scoped-records.util';
import { sendNotificationEmail } from './send-notification-email.util';
import { getDevelopmentRecordId } from './upsert-development-links.util';

// A guard rail against pathological payloads, not a real editing limit:
// pasted content (Word, Notion, Docs) can carry hidden formatting many times
// longer than what is shown on screen.
export const DISCUSSION_BODY_MAX_LENGTH = 200000;

export type DiscussionComment = {
  id: string;
  issueId: string;
  authorId?: string | null;
  mentionMemberIds?: string[] | null;
  parentCommentId?: string | null;
  bodyV2?: { markdown?: string | null; tiptap?: string | null } | null;
  createdAt: string;
};

export const DISCUSSION_NOTIFICATION_SELECTION = {
  id: true,
  issueId: true,
  recipientId: true,
  actorId: true,
  commentId: true,
  body: true,
  readAt: true,
  createdAt: true,
} as const;

export type DiscussionNotification = {
  id: string;
  issueId: string;
  recipientId: string;
  actorId: string;
  commentId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

export const requireDiscussionMember = (scope: CallerScope): string => {
  if (!isNonEmptyString(scope.workspaceMemberId)) {
    throw new AppScopePermissionDeniedError();
  }
  return scope.workspaceMemberId;
};

export const readDiscussionComment = async (
  client: ApiClient,
  issueId: string,
  commentId: string,
): Promise<DiscussionComment> => {
  const [comment] = await listScopedRecords<DiscussionComment>({
    client,
    pluralName: 'issueComments',
    filter: { id: { eq: commentId }, issueId: { eq: issueId } },
    selection: ISSUE_COMMENT_SELECTION,
    maxRecords: 1,
  });
  if (comment === undefined) throw new AppScopePermissionDeniedError();
  return comment;
};

export const readDiscussionBody = (body: unknown): string => {
  if (!isObject(body)) throw new Error('A message body is required.');
  const markdown = readRichTextPlainValue(
    body as DiscussionComment['bodyV2'],
  ).trim();
  if (!isNonEmptyString(markdown))
    throw new Error('A message cannot be empty.');
  if (markdown.length > DISCUSSION_BODY_MAX_LENGTH)
    throw new Error(
      `The message is too long (${markdown.length.toLocaleString('en-US')} characters, max ${DISCUSSION_BODY_MAX_LENGTH.toLocaleString('en-US')}). Pasted content often carries hidden formatting far longer than what is shown — try pasting as plain text instead.`,
    );
  return markdown;
};

export type DiscussionMember = {
  id: string;
  name?: { firstName?: string; lastName?: string };
  avatarUrl?: string | null;
  userEmail?: string | null;
};

export const formatMemberName = (member: DiscussionMember | undefined): string => {
  const fullName = `${member?.name?.firstName ?? ''} ${member?.name?.lastName ?? ''}`.trim();
  return fullName === '' ? 'Someone' : fullName;
};

export const listDiscussionMembers = async (
  client: ApiClient,
  appId: string,
): Promise<DiscussionMember[]> => {
  const grants = await listScopedRecords<{
    memberId: string;
    permissions?: string[];
  }>({
    client,
    pluralName: 'appAccesses',
    filter: { appId: { eq: appId } },
    selection: { id: true, memberId: true, permissions: true },
  });
  const memberIds = [
    ...new Set(
      grants
        .filter((grant) =>
          parseAppAccessPermissions(grant.permissions).includes('read'),
        )
        .map((grant) => grant.memberId),
    ),
  ];
  return memberIds.length === 0
    ? []
    : listScopedRecords<DiscussionMember>({
        client,
        pluralName: 'workspaceMembers',
        filter: { id: { in: memberIds } },
        selection: {
          id: true,
          name: { firstName: true, lastName: true },
          avatarUrl: true,
          userEmail: true,
        },
      });
};

// The stable primary key arbitrates concurrent retries without a process-local lock.
export const createDiscussionRowOnce = async <TRow extends { id: string }>({
  client,
  singularName,
  pluralName,
  data,
  selection,
}: {
  client: ApiClient;
  singularName: string;
  pluralName: string;
  data: Record<string, unknown> & { id: string };
  selection: Record<string, unknown>;
}): Promise<TRow> => {
  const existing = await listScopedRecords<TRow>({
    client,
    pluralName,
    filter: { id: { eq: data.id } },
    selection,
    maxRecords: 1,
  });
  if (existing[0] !== undefined) return existing[0];
  const mutationName = `create${singularName[0].toUpperCase()}${singularName.slice(1)}`;
  try {
    const result = await client.mutation({
      [mutationName]: { __args: { data }, ...selection },
    });
    return result[mutationName] as TRow;
  } catch (error) {
    const concurrent = await listScopedRecords<TRow>({
      client,
      pluralName,
      filter: { id: { eq: data.id } },
      selection,
      maxRecords: 1,
    });
    if (concurrent[0] === undefined) throw error;
    return concurrent[0];
  }
};

export const notifyDiscussionRecipients = async ({
  client,
  scope,
  appId,
  comment,
  recipients,
  issue,
  mentionedMemberIds = [],
}: {
  client: ApiClient;
  scope: CallerScope;
  appId: string;
  comment: DiscussionComment;
  recipients: string[];
  // Email only fires when the caller has the issue's context on hand — a
  // caller that doesn't (there is none today) just keeps the in-app row.
  issue?: NotificationIssue;
  mentionedMemberIds?: string[];
}): Promise<void> => {
  const actorId = requireDiscussionMember(scope);
  const members = await listDiscussionMembers(client, appId);
  const memberById = new Map(members.map((member) => [member.id, member]));
  const actorName = formatMemberName(memberById.get(actorId));
  const commentExcerpt = readRichTextPlainValue(comment.bodyV2).slice(0, 300);
  const mentionedSet = new Set(mentionedMemberIds);

  for (const recipientId of new Set(recipients)) {
    const member = memberById.get(recipientId);
    if (recipientId === actorId || member === undefined) continue;
    await createDiscussionRowOnce<DiscussionNotification>({
      client,
      singularName: 'issueNotification',
      pluralName: 'issueNotifications',
      data: {
        id: getDevelopmentRecordId([
          'discussion-notification',
          comment.id,
          recipientId,
        ]),
        issueId: comment.issueId,
        appId,
        recipientId,
        actorId,
        commentId: comment.id,
        body: commentExcerpt,
        readAt: null,
      },
      selection: DISCUSSION_NOTIFICATION_SELECTION,
    });

    if (issue !== undefined && isNonEmptyString(member.userEmail)) {
      try {
        const email = buildIssueCommentEmail({
          issue,
          actorName,
          commentExcerpt,
          isMention: mentionedSet.has(recipientId),
        });
        const result = await sendNotificationEmail(member.userEmail, email);
        if (!result.ok) {
          console.error('Issue comment notification email failed', result.error);
        }
      } catch (error) {
        console.error('Issue comment notification email failed', error);
      }
    }
  }
};

export const listVisibleDiscussionNotifications = async (
  client: ApiClient,
  scope: CallerScope,
): Promise<DiscussionNotification[]> => {
  const memberId = requireDiscussionMember(scope);
  const rows = await listScopedRecords<DiscussionNotification>({
    client,
    pluralName: 'issueNotifications',
    filter: { recipientId: { eq: memberId } },
    selection: DISCUSSION_NOTIFICATION_SELECTION,
    orderBy: [{ createdAt: 'DescNullsLast' }],
  });
  const visible: DiscussionNotification[] = [];
  const visibilityByIssue = new Map<string, boolean>();
  for (const row of rows) {
    if (!visibilityByIssue.has(row.issueId)) {
      try {
        await assertRecordInScope({
          client,
          scope,
          objectNameSingular: 'issue',
          recordId: row.issueId,
          operation: 'read',
        });
        visibilityByIssue.set(row.issueId, true);
      } catch (error) {
        if (!(error instanceof AppScopePermissionDeniedError)) throw error;
        visibilityByIssue.set(row.issueId, false);
      }
    }
    if (!visibilityByIssue.get(row.issueId)) continue;
    try {
      const comment = await readDiscussionComment(
        client,
        row.issueId,
        row.commentId,
      );
      visible.push({
        ...row,
        body: readRichTextPlainValue(comment.bodyV2).slice(0, 300),
      });
    } catch (error) {
      if (!(error instanceof AppScopePermissionDeniedError)) throw error;
    }
  }
  return visible;
};
