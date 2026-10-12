import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  DISCUSSION_PAGE_SIZE,
  DISCUSSION_REACTIONS,
  DISCUSSION_STATE_LOGIC_FUNCTION_UID,
  DISCUSSION_STATE_ROUTE_PATH,
} from '../constants/discussion';
import { ISSUE_COMMENT_SELECTION } from '../constants/record-selections';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { resolveRecordAppId } from './app-scope/resolve-record-app-id.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';
import {
  createDiscussionRowOnce,
  DISCUSSION_NOTIFICATION_SELECTION,
  type DiscussionComment,
  type DiscussionNotification,
  listDiscussionMembers,
  listVisibleDiscussionNotifications,
  readDiscussionComment,
  requireDiscussionMember,
} from './utils/discussion-storage.util';
import { getDevelopmentRecordId } from './utils/upsert-development-links.util';

type DiscussionBody = {
  action?: string;
  issueId?: string;
  cursor?: string;
  commentId?: string;
  emoji?: string;
  active?: boolean;
  notificationId?: string;
};

type ReadState = {
  id: string;
  memberId: string;
  commentId?: string | null;
  lastReadAt: string;
};
const READ_STATE_SELECTION = {
  id: true,
  commentId: true,
  memberId: true,
  lastReadAt: true,
} as const;
const DISCUSSION_PARTICIPANT_SELECTION = {
  id: true,
  name: { firstName: true, lastName: true },
  avatarUrl: true,
  userEmail: true,
} as const;
const REACTION_SELECTION = {
  id: true,
  memberId: true,
  commentId: true,
  emoji: true,
} as const;

const handler = async (event: RoutePayload<DiscussionBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const memberId = requireDiscussionMember(scope);
    const body = event.body ?? {};
    const action = requireString(body.action, 'action');
    if (action === 'notifications') {
      const notifications = await listVisibleDiscussionNotifications(
        client,
        scope,
      );
      return {
        notifications: notifications.slice(0, 100),
        unreadCount: notifications.filter((row) => row.readAt == null).length,
      };
    }
    if (action === 'readNotification') {
      const notificationId = requireString(
        body.notificationId,
        'notificationId',
      );
      const [notification] = await listScopedRecords<DiscussionNotification>({
        client,
        pluralName: 'issueNotifications',
        filter: { id: { eq: notificationId }, recipientId: { eq: memberId } },
        selection: DISCUSSION_NOTIFICATION_SELECTION,
        maxRecords: 1,
      });
      if (notification === undefined) throw new AppScopePermissionDeniedError();
      await assertRecordInScope({
        client,
        scope,
        objectNameSingular: 'issue',
        recordId: notification.issueId,
        operation: 'read',
      });
      await client.mutation({
        updateIssueNotification: {
          __args: {
            id: notificationId,
            data: { readAt: new Date().toISOString() },
          },
          id: true,
        },
      });
      return { notificationId };
    }
    const issueId = requireString(body.issueId, 'issueId');
    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'read',
    });
    const appId = await resolveRecordAppId({
      client,
      objectNameSingular: 'issue',
      recordId: issueId,
    });
    if (appId === null) throw new AppScopePermissionDeniedError();
    if (action === 'authorize')
      return { issueId, appId, currentMemberId: memberId };
    if (action === 'snapshot') {
      const [page, reactions, checkpoints, members] = await Promise.all([
        client.query({
          issueComments: {
            __args: {
              filter: { issueId: { eq: issueId } },
              first: DISCUSSION_PAGE_SIZE + 1,
              orderBy: [
                { createdAt: 'DescNullsLast' },
                { id: 'DescNullsLast' },
              ],
              ...(body.cursor === undefined
                ? {}
                : { after: requireString(body.cursor, 'cursor') }),
            },
            edges: { cursor: true, node: ISSUE_COMMENT_SELECTION },
          },
        }),
        listScopedRecords<{ memberId: string }>({
          client,
          pluralName: 'issueReactions',
          filter: { issueId: { eq: issueId }, isActive: { eq: true } },
          selection: REACTION_SELECTION,
        }),
        listScopedRecords<ReadState>({
          client,
          pluralName: 'issueReadStates',
          filter: { issueId: { eq: issueId } },
          selection: READ_STATE_SELECTION,
        }),
        listDiscussionMembers(client, appId),
      ]);
      const edges =
        (
          page as {
            issueComments?: {
              edges?: { cursor: string; node: DiscussionComment }[];
            };
          }
        ).issueComments?.edges ?? [];
      const readStatesByMember = new Map<string, ReadState>();
      for (const checkpoint of checkpoints) {
        const checkpointKey = `${checkpoint.memberId}:${checkpoint.commentId ?? ''}`;
        const previous = readStatesByMember.get(checkpointKey);
        if (
          previous === undefined ||
          new Date(checkpoint.lastReadAt).getTime() >
            new Date(previous.lastReadAt).getTime()
        )
          readStatesByMember.set(checkpointKey, checkpoint);
      }
      // Members only lists who may be mentioned. Anyone who can open the issue
      // leaves read receipts and reactions, so their names are resolved too.
      const memberIdsWithNames = new Set(members.map((member) => member.id));
      const participantIds = [
        ...new Set(
          [
            ...checkpoints.map((checkpoint) => checkpoint.memberId),
            ...reactions.map((reaction) => reaction.memberId),
            ...edges.map((edge) => edge.node.authorId),
          ].filter(
            (participantId): participantId is string =>
              typeof participantId === 'string' &&
              !memberIdsWithNames.has(participantId),
          ),
        ),
      ];
      const participants =
        participantIds.length === 0
          ? []
          : await listScopedRecords({
              client,
              pluralName: 'workspaceMembers',
              filter: { id: { in: participantIds } },
              selection: DISCUSSION_PARTICIPANT_SELECTION,
            });
      return {
        comments: edges.slice(0, DISCUSSION_PAGE_SIZE).map((edge) => edge.node),
        nextCursor:
          edges.length > DISCUSSION_PAGE_SIZE
            ? edges[DISCUSSION_PAGE_SIZE - 1].cursor
            : null,
        reactions,
        readStates: [...readStatesByMember.values()],
        members,
        participants,
        currentMemberId: memberId,
        canWrite: hasAppGrant(scope, appId, 'write'),
        canSoftDelete: hasAppGrant(scope, appId, 'softDelete'),
      };
    }
    const commentId = requireString(body.commentId, 'commentId');
    const comment = await readDiscussionComment(client, issueId, commentId);
    if (action === 'react') {
      if (!hasAppGrant(scope, appId, 'write'))
        throw new AppScopePermissionDeniedError();
      if (
        !DISCUSSION_REACTIONS.some((emoji) => emoji === body.emoji) ||
        typeof body.active !== 'boolean'
      )
        throw new Error('Invalid reaction.');
      const id = getDevelopmentRecordId([
        'discussion-reaction',
        commentId,
        memberId,
        body.emoji ?? '',
      ]);
      const [reaction] = await listScopedRecords<{ id: string }>({
        client,
        pluralName: 'issueReactions',
        filter: { id: { eq: id } },
        selection: { id: true },
        maxRecords: 1,
      });
      if (reaction !== undefined) {
        await client.mutation({
          updateIssueReaction: {
            __args: { id, data: { isActive: body.active } },
            id: true,
          },
        });
      } else if (body.active) {
        await createDiscussionRowOnce({
          client,
          singularName: 'issueReaction',
          pluralName: 'issueReactions',
          data: {
            id,
            issueId,
            appId,
            commentId,
            memberId,
            emoji: body.emoji,
            isActive: true,
          },
          selection: REACTION_SELECTION,
        });
      }
      return { issueId };
    }
    if (action === 'read') {
      if (!Number.isFinite(new Date(comment.createdAt).getTime()))
        throw new Error('The message has no valid timestamp.');
      // Per-comment receipts do not acknowledge older messages the viewer has not seen.
      await createDiscussionRowOnce({
        client,
        singularName: 'issueReadState',
        pluralName: 'issueReadStates',
        data: {
          id: getDevelopmentRecordId([
            'discussion-read',
            issueId,
            memberId,
            comment.id,
          ]),
          issueId,
          appId,
          memberId,
          commentId: comment.id,
          lastReadAt: comment.createdAt,
        },
        selection: READ_STATE_SELECTION,
      });
      return {
        issueId,
        readState: {
          memberId,
          commentId: comment.id,
          lastReadAt: comment.createdAt,
        },
      };
    }
    throw new Error('Unknown discussion action.');
  });

export default defineLogicFunction({
  universalIdentifier: DISCUSSION_STATE_LOGIC_FUNCTION_UID,
  name: 'discussion-state',
  description: 'Scoped task discussions and member notifications',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: DISCUSSION_STATE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
