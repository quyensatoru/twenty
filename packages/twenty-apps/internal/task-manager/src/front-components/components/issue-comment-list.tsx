import { useEffect, useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconArrowBackUp,
  IconLink,
  IconPencil,
  IconTrash,
} from 'twenty-ui/icon';

import { readRichTextPlainValue } from '../../utils/read-rich-text-plain-value.util';
import {
  type IssueCommentRow,
  type MemberRow,
} from '../hooks/use-issue-detail';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useLinkedIssueSummaries } from '../hooks/use-linked-issue-summaries';
import { buildIssueCommentUrl } from '../utils/build-record-url.util';
import { collapseThreadReplies } from '../utils/collapse-thread-replies.util';
import { formatRelativeTimeLabel } from '../utils/format-relative-time-label.util';
import { isGroupedFeedItem } from '../utils/is-grouped-feed-item.util';
import { findLinkedIssueIds } from '../utils/parse-rich-text-link.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskAvatar } from './task-avatar';
import { TaskButton } from './task-button';
import { copyLinkToClipboard } from './task-copy-link-button';
import { TASK_COMPOSER_BOX_STYLE } from './task-control-styles';
import {
  FEED_BODY_INDENT,
  FEED_GAP,
  FEED_INLINE_INSET,
  FEED_TEXT_INSET,
  TaskFeedComposerRow,
  TaskFeedItem,
  TaskFeedThread,
  TaskFeedThreadRow,
} from './task-feed-item';
import { TaskFeedMoreMenu } from './task-feed-more-menu';
import { TaskIconButton } from './task-icon-button';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskRichTextLinkChipsContext } from './task-rich-text-link-chip';
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
import { TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

type IssueCommentListProps = {
  issueId: string;
  baseUrl: string | undefined;
  boardPath?: string | null;
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
  onRead?: (commentIds: string[]) => Promise<void> | void;
  onUpdate: (commentId: string, markdown: string) => void;
  onDelete: (commentId: string) => void;
  // Set by a caller that shows the sort toggle itself (on its tab row); the
  // list then drops its own.
  sortIsNewestFirst?: boolean;
};

const ROW_INLINE_PADDING = 10;
// The connector meets these rows at their middle rather than at an avatar.
const MORE_REPLIES_ELBOW_TOP = 14;
const REPLY_COMPOSER_ELBOW_TOP = 22;
const FACEPILE_AVATAR_SIZE = 16;

const readCommentTimestamp = (comment: IssueCommentRow): number => {
  const parsed = new Date(comment.createdAt ?? '').getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const ThreadMoreRepliesButton = ({
  hiddenCount,
  hiddenAuthorIds,
  lastReplyAt,
  membersById,
  onExpand,
}: {
  hiddenCount: number;
  hiddenAuthorIds: string[];
  lastReplyAt: string | null;
  membersById: Map<string, MemberRow>;
  onExpand: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const lastReplyLabel = formatRelativeTimeLabel(lastReplyAt);

  return (
    <button
      type="button"
      onClick={onExpand}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        alignSelf: 'flex-start',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: 6,
        color: TASK_TOKENS.accent,
        cursor: 'pointer',
        display: 'inline-flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12.5,
        gap: 8,
        height: 28,
        padding: '0 10px 0 4px',
      }}
    >
      <span style={{ display: 'inline-flex' }}>
        {hiddenAuthorIds.map((authorId, index) => {
          const name = readMemberName(membersById, authorId, t('Unknown'));

          return (
            <span
              key={authorId}
              style={{
                ...TASK_CIRCLE_STYLE,
                boxShadow: `0 0 0 1.5px ${TASK_TOKENS.background}`,
                display: 'inline-flex',
                marginLeft: index === 0 ? 0 : -4,
              }}
            >
              <TaskAvatar
                name={name}
                avatarUrl={membersById.get(authorId)?.avatarUrl}
                size={FACEPILE_AVATAR_SIZE}
              />
            </span>
          );
        })}
      </span>
      <span style={{ fontWeight: 500 }}>
        {t('{count} more replies', { count: hiddenCount })}
      </span>
      {lastReplyLabel !== '' && (
        <span style={{ color: TASK_TOKENS.textTertiary }}>
          {`· ${t('last {time}', { time: lastReplyLabel })}`}
        </span>
      )}
    </button>
  );
};

export const IssueCommentList = ({
  issueId,
  baseUrl,
  boardPath,
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
  sortIsNewestFirst,
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
  const isMobile = useIsMobile();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  // What Save last sent for a comment, shown ahead of the server. onUpdate
  // only starts the write and a full issue reload after it — without this,
  // Save's own switch back to the read view would show the pre-edit text
  // again until that reload lands.
  const [commentOverridesById, setCommentOverridesById] = useState<
    Record<string, string>
  >({});
  // A reply always answers the thread's top comment: one level is what the
  // data carries (parentCommentId), so replying to a reply joins its thread.
  const [replyingToRootId, setReplyingToRootId] = useState<string | null>(null);
  const [expandedThreadIds, setExpandedThreadIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(
    null,
  );
  const [ownIsNewestFirst, setIsNewestFirst] = useState(false);
  const isNewestFirst = sortIsNewestFirst ?? ownIsNewestFirst;

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

  const readCommentMarkdown = (comment: IssueCommentRow) =>
    commentOverridesById[comment.id] ?? readRichTextPlainValue(comment.bodyV2);

  const linkedIssueIds = useMemo(
    () =>
      findLinkedIssueIds(
        optimistic.comments
          .map(
            (comment) =>
              commentOverridesById[comment.id] ??
              readRichTextPlainValue(comment.bodyV2),
          )
          .join('\n'),
      ),
    [optimistic.comments, commentOverridesById],
  );
  const linkedIssuesById = useLinkedIssueSummaries(linkedIssueIds);
  const linkChips = useMemo(
    () => ({ baseUrl, issuesById: linkedIssuesById }),
    [baseUrl, linkedIssuesById],
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

  const startReply = (rootId: string) => {
    setReplyingToRootId(rootId);
    // The reply lands at the end of the thread, so the thread opens to show it.
    setExpandedThreadIds((previous) => new Set([...previous, rootId]));
  };

  const renderComment = ({
    comment,
    rootId,
    isReply,
    isGrouped,
    hasThread,
  }: {
    comment: IssueCommentRow;
    rootId: string;
    isReply: boolean;
    isGrouped: boolean;
    hasThread: boolean;
  }) => {
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
    const canReply = canWrite && isPersisted;
    const author =
      typeof comment.authorId === 'string'
        ? membersById.get(comment.authorId)
        : undefined;
    const authorName = readMemberName(
      membersById,
      comment.authorId,
      t('Unknown'),
    );
    const canReact = canWrite && isPersisted && onReact !== undefined;
    const hasReactions = reactions.some(
      (reaction) => reaction.commentId === comment.id,
    );
    const hasActions = isPersisted && !isEditing;
    const hasStatus =
      !isEditing && (delivery !== undefined || readMemberIds.length > 0);

    return (
      <div
        key={comment.id}
        id={`discussion-comment-${comment.id}`}
        ref={registerVisibleComment(comment.id)}
      >
        <TaskFeedItem
          anchorId={`comment-${comment.id}`}
          isHighlighted={comment.id === highlightedCommentId}
          authorName={authorName}
          authorEmail={author?.userEmail}
          avatarUrl={author?.avatarUrl}
          timestamp={comment.createdAt}
          isReply={isReply}
          isGrouped={isGrouped}
          hasThread={hasThread}
          shouldShowHoverActions={isMobile || openMenuCommentId === comment.id}
          actions={
            hasActions ? (
              <>
                {hasReactions && (
                  <span
                    style={{
                      alignItems: 'center',
                      display: 'inline-flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      margin: '0 4px',
                    }}
                  >
                    <TaskCommentReactions
                      commentId={comment.id}
                      reactions={reactions}
                      membersById={membersById}
                      currentMemberId={currentMemberId}
                      canReact={canReact}
                      onReact={onReact}
                      shouldShowPicker={false}
                    />
                  </span>
                )}
                {canReact && (
                  <TaskCommentReactions
                    commentId={comment.id}
                    reactions={reactions}
                    membersById={membersById}
                    currentMemberId={currentMemberId}
                    canReact={canReact}
                    onReact={onReact}
                    shouldShowChips={false}
                  />
                )}
                {canReply && (
                  <TaskIconButton
                    label={t('Reply')}
                    isDisabled={isBusy}
                    onClick={() => startReply(rootId)}
                  >
                    <IconArrowBackUp size={14} />
                  </TaskIconButton>
                )}
              </>
            ) : undefined
          }
          hoverActions={
            hasActions ? (
              <>
                {canEdit && (
                  <TaskIconButton
                    label={t('Edit')}
                    isDisabled={isBusy}
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditDraft(readCommentMarkdown(comment));
                    }}
                  >
                    <IconPencil size={14} />
                  </TaskIconButton>
                )}
                {boardPath !== null && (
                  <TaskIconButton
                    label={t('Copy link')}
                    onClick={() =>
                      copyLinkToClipboard(
                        buildIssueCommentUrl({
                          baseUrl,
                          issueId,
                          commentId: comment.id,
                          boardPath,
                        }),
                      )
                    }
                  >
                    <IconLink size={14} />
                  </TaskIconButton>
                )}
                <TaskFeedMoreMenu
                  onOpenChange={(isOpen) =>
                    setOpenMenuCommentId(isOpen ? comment.id : null)
                  }
                  items={[
                    ...(canDelete
                      ? [
                          {
                            key: 'delete',
                            label: t('Delete comment'),
                            icon: <IconTrash size={14} />,
                            isDanger: true,
                            confirmLabel: t('Confirm delete?'),
                            onSelect: () => onDelete(comment.id),
                          },
                        ]
                      : []),
                  ]}
                />
              </>
            ) : undefined
          }
          status={
            hasStatus ? (
              <>
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
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      fontSize: 11,
                      marginLeft: 6,
                    }}
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
              value={readCommentMarkdown(comment)}
              isReadOnly
            />
          )}
        </TaskFeedItem>
      </div>
    );
  };

  const renderThread = (rootId: string, replies: IssueCommentRow[]) => {
    const isReplying = replyingToRootId === rootId;
    const { visibleReplies, hiddenCount, hiddenAuthorIds, lastReplyAt } =
      collapseThreadReplies({
        replies,
        isExpanded: expandedThreadIds.has(rootId),
        highlightedReplyId: highlightedCommentId,
      });
    const hasMoreRow = hiddenCount > 0;

    if (visibleReplies.length === 0 && !isReplying) {
      return null;
    }

    return (
      <TaskFeedThread>
        {visibleReplies.map((reply, index) => (
          <TaskFeedThreadRow
            key={reply.id}
            isLast={
              index === visibleReplies.length - 1 && !hasMoreRow && !isReplying
            }
          >
            {renderComment({
              comment: reply,
              rootId,
              isReply: true,
              isGrouped: false,
              hasThread: false,
            })}
          </TaskFeedThreadRow>
        ))}
        {hasMoreRow && (
          <TaskFeedThreadRow
            isLast={!isReplying}
            elbowTop={MORE_REPLIES_ELBOW_TOP}
          >
            <ThreadMoreRepliesButton
              hiddenCount={hiddenCount}
              hiddenAuthorIds={hiddenAuthorIds}
              lastReplyAt={lastReplyAt}
              membersById={membersById}
              onExpand={() =>
                setExpandedThreadIds(
                  (previous) => new Set([...previous, rootId]),
                )
              }
            />
          </TaskFeedThreadRow>
        )}
        {isReplying && (
          <TaskFeedThreadRow isLast elbowTop={REPLY_COMPOSER_ELBOW_TOP}>
            <TaskFeedComposerRow
              isReply
              name={readMemberName(membersById, currentMemberId, '')}
              avatarUrl={
                currentMemberId === null
                  ? undefined
                  : membersById.get(currentMemberId)?.avatarUrl
              }
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  paddingTop: 4,
                }}
              >
                <DiscussionComposer
                  issueId={issueId}
                  members={mentionMembers}
                  parentCommentId={rootId}
                  onCreate={optimistic.create}
                  showConfirmation={false}
                  onDone={() => setReplyingToRootId(null)}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <TaskButton
                    size="small"
                    onClick={() => setReplyingToRootId(null)}
                  >
                    {t('Cancel')}
                  </TaskButton>
                </div>
              </div>
            </TaskFeedComposerRow>
          </TaskFeedThreadRow>
        )}
      </TaskFeedThread>
    );
  };

  const composer = canWrite ? (
    <TaskFeedComposerRow
      name={readMemberName(membersById, currentMemberId, '')}
      avatarUrl={
        currentMemberId === null
          ? undefined
          : membersById.get(currentMemberId)?.avatarUrl
      }
    >
      <DiscussionComposer
        issueId={issueId}
        members={mentionMembers}
        onCreate={optimistic.create}
        showConfirmation={false}
      />
    </TaskFeedComposerRow>
  ) : null;

  return (
    <TaskRichTextLinkChipsContext.Provider value={linkChips}>
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: FEED_GAP,
          padding: `0 ${FEED_INLINE_INSET}px`,
        }}
      >
        {composer}

        {optimistic.comments.length === 0 ? (
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              // Under the composer's own text, not the avatar or the box edge.
              padding: `0 0 0 ${FEED_BODY_INDENT + FEED_TEXT_INSET}px`,
            }}
          >
            {canWrite
              ? t('No comments yet. Ask a question or share an update.')
              : t('No comments yet.')}
          </span>
        ) : sortIsNewestFirst === undefined ? (
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
        ) : null}

        {threads.map(({ comment, replies }, index) => {
          const previous = threads[index - 1];
          // Only top-level comments group, and never across a thread: the
          // replies between them would make the second one look like a reply.
          const isGrouped =
            previous !== undefined &&
            previous.replies.length === 0 &&
            replyingToRootId !== previous.comment.id &&
            isGroupedFeedItem(
              {
                authorId: previous.comment.authorId,
                timestamp: previous.comment.createdAt,
              },
              { authorId: comment.authorId, timestamp: comment.createdAt },
            );
          const thread = renderThread(comment.id, replies);

          return (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: isGrouped ? -FEED_GAP : 0,
                minWidth: 0,
              }}
            >
              {renderComment({
                comment,
                rootId: comment.id,
                isReply: false,
                isGrouped,
                hasThread: thread !== null,
              })}
              {thread}
            </div>
          );
        })}
      </section>
    </TaskRichTextLinkChipsContext.Provider>
  );
};
