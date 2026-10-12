import { useEffect, useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconArrowBackUp,
  IconMessage,
  IconPencil,
  IconTrash,
} from 'twenty-ui/icon';

import { readRichTextPlainValue } from '../../utils/read-rich-text-plain-value.util';
import {
  type IssueCommentRow,
  type MemberRow,
} from '../hooks/use-issue-detail';
import { buildIssueCommentUrl } from '../utils/build-record-url.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskAvatar } from './task-avatar';
import { TaskButton } from './task-button';
import { TaskCopyLinkButton } from './task-copy-link-button';
import { TASK_COMPOSER_BOX_STYLE } from './task-control-styles';
import {
  FEED_BODY_INDENT,
  FEED_INLINE_INSET,
  TaskFeedItem,
} from './task-feed-item';
import { TaskEmptyState } from './task-empty-state';
import { TaskIconButton } from './task-icon-button';
import { TaskRichTextEditor } from './task-rich-text-editor';
import {
  DiscussionComposer,
  type DiscussionCreateInput,
} from './discussion-composer';
import {
  type DiscussionReaction,
  type DiscussionReadState,
} from '../hooks/use-discussion-state';
import { useAutomaticCommentRead } from '../hooks/use-automatic-comment-read';
import { useOptimisticDiscussionComments } from '../hooks/use-optimistic-discussion-comments';
import { hasReadComment } from '../utils/has-read-comment.util';
import { TaskCommentReactions } from './task-comment-reactions';
import { TaskSortToggle } from './task-sort-toggle';
import { TASK_TOKENS } from './task-tokens';

type IssueCommentListProps = {
  issueId: string;
  baseUrl: string | undefined;
  comments: IssueCommentRow[];
  membersById: Map<string, MemberRow>;
  currentMemberId: string | null;
  highlightedCommentId: string | null;
  // The caller's grants on the issue's app: writing covers posting, replying
  // and editing; deleting needs its own grant.
  canWrite: boolean;
  canSoftDelete: boolean;
  isBusy: boolean;
  onCreate: (input: DiscussionCreateInput) => Promise<IssueCommentRow | void>;
  mentionMembers?: MemberRow[];
  reactions?: DiscussionReaction[];
  readStates?: DiscussionReadState[];
  onReact?: (commentId: string, emoji: string, active: boolean) => void;
  onRead?: (commentId: string) => Promise<void> | void;
  onUpdate: (commentId: string, markdown: string) => void;
  onDelete: (commentId: string) => void;
};

// One line at rest, growing with what is typed. The reference composer is a
// single row — box and button side by side — rather than a paragraph-sized
// box with its button on a line of its own underneath.
// A reply is indented under the comment it answers rather than threaded into a
// tree: one level is what the data carries (parentCommentId) and what a panel
// this narrow can show without the text column collapsing.
const REPLY_INDENT = 36;
const ROW_INLINE_PADDING = 10;

const readCommentTimestamp = (comment: IssueCommentRow): number => {
  const parsed = new Date(comment.createdAt ?? '').getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

export const IssueCommentList = ({
  issueId,
  baseUrl,
  comments,
  membersById,
  currentMemberId,
  highlightedCommentId,
  canWrite,
  canSoftDelete,
  isBusy,
  onCreate,
  mentionMembers = [],
  reactions = [],
  readStates = [],
  onReact,
  onRead,
  onUpdate,
  onDelete,
}: IssueCommentListProps) => {
  const optimistic = useOptimisticDiscussionComments({
    comments,
    currentMemberId,
    onCreate,
  });
  const registerVisibleComment = useAutomaticCommentRead({
    comments,
    currentMemberId,
    readStates,
    onRead,
  });
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  // What Save last sent for a comment, shown ahead of the server. onUpdate
  // only starts the write and a full issue reload after it — without this,
  // Save's own switch back to the read view would show the pre-edit text
  // again until that reload lands.
  const [commentOverridesById, setCommentOverridesById] = useState<
    Record<string, string>
  >({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );
  const [isNewestFirst, setIsNewestFirst] = useState(false);

  // Drops an override once the reload it was standing in for lands and
  // agrees with it, and any whose comment is gone (deleted, or this moved to
  // another issue) — otherwise a stale local copy would outlive the record it
  // was covering for.
  useEffect(() => {
    setCommentOverridesById((previous) => {
      if (Object.keys(previous).length === 0) {
        return previous;
      }

      const commentsById = new Map(
        comments.map((comment) => [comment.id, comment]),
      );
      let hasChanged = false;
      const next: Record<string, string> = {};

      for (const [commentId, overrideMarkdown] of Object.entries(previous)) {
        const comment = commentsById.get(commentId);
        const isSettled =
          comment === undefined ||
          readRichTextPlainValue(comment.bodyV2) === overrideMarkdown;

        if (isSettled) {
          hasChanged = true;
          continue;
        }

        next[commentId] = overrideMarkdown;
      }

      return hasChanged ? next : previous;
    });
  }, [comments]);

  const currentMemberName = readMemberName(
    membersById,
    currentMemberId,
    t('You'),
  );

  // Replies stay with the comment they answer whichever way the thread is
  // sorted: only the top-level comments reorder.
  const threads = useMemo(() => {
    const repliesByParentId = new Map<string, IssueCommentRow[]>();
    const roots: IssueCommentRow[] = [];

    for (const comment of optimistic.comments) {
      const parentCommentId = comment.parentCommentId;

      if (typeof parentCommentId !== 'string') {
        roots.push(comment);
        continue;
      }

      repliesByParentId.set(parentCommentId, [
        ...(repliesByParentId.get(parentCommentId) ?? []),
        comment,
      ]);
    }

    // A reply whose parent is gone would otherwise vanish with it.
    const rootIds = new Set(roots.map((comment) => comment.id));

    for (const [parentCommentId, replies] of [...repliesByParentId]) {
      if (!rootIds.has(parentCommentId)) {
        roots.push(...replies);
        repliesByParentId.delete(parentCommentId);
      }
    }

    const sortedRoots = [...roots].sort((left, right) =>
      isNewestFirst
        ? readCommentTimestamp(right) - readCommentTimestamp(left)
        : readCommentTimestamp(left) - readCommentTimestamp(right),
    );

    return sortedRoots.map((comment) => ({
      comment,
      // Replies always read oldest first: they are a conversation, and a
      // conversation read backwards answers questions before they are asked.
      replies: [...(repliesByParentId.get(comment.id) ?? [])].sort(
        (left, right) =>
          readCommentTimestamp(left) - readCommentTimestamp(right),
      ),
    }));
  }, [optimistic.comments, isNewestFirst]);

  const renderComment = (comment: IssueCommentRow, isReply: boolean) => {
    const delivery = optimistic.deliveryFor(comment);
    const isPersisted = !comment.id.startsWith('pending-');
    const readMemberIds = [
      ...new Set(
        readStates
          .filter(
            (state) =>
              state.memberId !== comment.authorId &&
              hasReadComment([state], state.memberId, comment),
          )
          .map((state) => state.memberId),
      ),
    ];
    const isEditing = editingCommentId === comment.id;
    // The route enforces the same rule; hiding the controls just stops the
    // UI from offering an action the server will refuse.
    const isOwnComment =
      currentMemberId !== null && comment.authorId === currentMemberId;
    const canEdit = isOwnComment && canWrite && isPersisted;
    const canDelete = isOwnComment && canSoftDelete && isPersisted;
    // Replying to a reply would need a tree the data does not carry, so a
    // second level always answers the same root.
    const canReply = !isReply && canWrite && isPersisted;
    const author =
      typeof comment.authorId === 'string'
        ? membersById.get(comment.authorId)
        : undefined;
    const authorName = readMemberName(
      membersById,
      comment.authorId,
      t('Unknown'),
    );

    return (
      <div
        key={comment.id}
        id={`discussion-comment-${comment.id}`}
        ref={registerVisibleComment(comment.id)}
      >
        <TaskFeedItem
          key={comment.id}
          anchorId={`comment-${comment.id}`}
          isHighlighted={comment.id === highlightedCommentId}
          authorName={authorName}
          authorEmail={author?.userEmail}
          avatarUrl={author?.avatarUrl}
          timestamp={comment.createdAt}
          nameAction={
            isEditing || !isPersisted ? undefined : (
              <TaskCopyLinkButton
                url={buildIssueCommentUrl({
                  baseUrl,
                  issueId,
                  commentId: comment.id,
                })}
                label={t('Copy link to comment')}
              />
            )
          }
          actions={
            isEditing ? undefined : (
              <>
                {canReply && (
                  <TaskIconButton
                    label={t('Reply')}
                    isDisabled={isBusy}
                    onClick={() => {
                      setReplyingToCommentId(comment.id);
                    }}
                  >
                    <IconArrowBackUp size={14} />
                  </TaskIconButton>
                )}
                {canEdit && (
                  <TaskIconButton
                    label={t('Edit')}
                    isDisabled={isBusy}
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditDraft(
                        commentOverridesById[comment.id] ??
                          readRichTextPlainValue(comment.bodyV2),
                      );
                    }}
                  >
                    <IconPencil size={14} />
                  </TaskIconButton>
                )}
                {canDelete && (
                  <TaskIconButton
                    label={t('Delete')}
                    isDanger
                    isDisabled={isBusy}
                    onClick={() => onDelete(comment.id)}
                  >
                    <IconTrash size={14} />
                  </TaskIconButton>
                )}
                <TaskCommentReactions
                  commentId={comment.id}
                  reactions={reactions}
                  membersById={membersById}
                  currentMemberId={currentMemberId}
                  canReact={canWrite && isPersisted && onReact !== undefined}
                  onReact={onReact}
                />

                {delivery?.status === 'sending' && (
                  <span
                    role="status"
                    style={{ fontSize: 11, color: TASK_TOKENS.textTertiary }}
                  >
                    {t('Sending…')}
                  </span>
                )}
                {delivery?.status === 'failed' && (
                  <>
                    <span
                      role="alert"
                      style={{ fontSize: 11, color: TASK_TOKENS.textDanger }}
                    >
                      {delivery.error}
                    </span>
                    <TaskButton
                      size="small"
                      onClick={() => optimistic.retry(delivery)}
                    >
                      {t('Retry')}
                    </TaskButton>
                  </>
                )}
                {readMemberIds.length > 0 && (
                  <span
                    style={{ fontSize: 11, color: TASK_TOKENS.textTertiary }}
                  >
                    {t('Read by')}{' '}
                    {readMemberIds
                      .map((memberId) =>
                        readMemberName(membersById, memberId, t('Unknown')),
                      )
                      .join(', ')}
                  </span>
                )}
              </>
            )
          }
          footer={
            replyingToCommentId === comment.id ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  paddingTop: 6,
                }}
              >
                <DiscussionComposer
                  issueId={issueId}
                  members={mentionMembers}
                  parentCommentId={comment.id}
                  onCreate={optimistic.create}
                  showConfirmation={false}
                  onDone={() => setReplyingToCommentId(null)}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <TaskButton
                    size="small"
                    onClick={() => setReplyingToCommentId(null)}
                  >
                    {t('Cancel')}
                  </TaskButton>
                </div>
              </div>
            ) : undefined
          }
        >
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...TASK_COMPOSER_BOX_STYLE, display: 'flex' }}>
                <TaskRichTextEditor
                  value={editDraft}
                  onChange={setEditDraft}
                  issueId={issueId}
                />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <TaskButton
                  variant="primary"
                  size="small"
                  isDisabled={isBusy || editDraft.trim() === ''}
                  onClick={() => {
                    const markdown = editDraft.trim();

                    setCommentOverridesById((previous) => ({
                      ...previous,
                      [comment.id]: markdown,
                    }));
                    onUpdate(comment.id, markdown);
                    setEditingCommentId(null);
                  }}
                >
                  {t('Save')}
                </TaskButton>
                <TaskButton
                  size="small"
                  onClick={() => setEditingCommentId(null)}
                >
                  {t('Cancel')}
                </TaskButton>
              </div>
            </div>
          ) : (
            <TaskRichTextEditor
              value={
                commentOverridesById[comment.id] ??
                readRichTextPlainValue(comment.bodyV2)
              }
              isReadOnly
            />
          )}
        </TaskFeedItem>
      </div>
    );
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: `0 ${FEED_INLINE_INSET}px`,
      }}
    >
      {canWrite && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: `0 ${ROW_INLINE_PADDING}px 8px`,
          }}
        >
          <TaskAvatar
            name={currentMemberName}
            avatarUrl={
              currentMemberId === null
                ? null
                : membersById.get(currentMemberId)?.avatarUrl
            }
            size={24}
          />
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 8,
              minWidth: 0,
            }}
          >
            <DiscussionComposer
              issueId={issueId}
              members={mentionMembers}
              onCreate={optimistic.create}
              showConfirmation={false}
            />
          </div>
        </div>
      )}

      {optimistic.comments.length === 0 ? (
        <TaskEmptyState
          icon={<IconMessage size={16} />}
          title={t('No comments yet')}
          description={t(
            'Start the conversation — ask a question, share an update or leave feedback.',
          )}
          // Indented to the composer box it sits under, so the two read as
          // one column instead of two widths stacked on each other.
          style={{
            margin: `0 ${ROW_INLINE_PADDING}px 0 ${ROW_INLINE_PADDING + FEED_BODY_INDENT}px`,
            padding: 16,
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: `0 ${ROW_INLINE_PADDING}px`,
          }}
        >
          <TaskSortToggle
            isNewestFirst={isNewestFirst}
            onChange={setIsNewestFirst}
          />
        </div>
      )}

      {threads.map(({ comment, replies }) => (
        <div
          key={comment.id}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {renderComment(comment, false)}
          {replies.length > 0 && (
            <div
              style={{
                borderLeft: `1px solid ${TASK_TOKENS.borderLight}`,
                display: 'flex',
                flexDirection: 'column',
                marginLeft: REPLY_INDENT,
              }}
            >
              {replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
};
