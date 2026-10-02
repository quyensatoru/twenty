import { useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconArrowBackUp, IconPencil, IconTrash } from 'twenty-ui/icon';

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
import {
  FEED_BODY_INDENT,
  FEED_INLINE_INSET,
  TaskFeedItem,
} from './task-feed-item';
import { TaskIconButton } from './task-icon-button';
import {
  BLOCK_HANDLE_GUTTER,
  TaskRichTextEditor,
} from './task-rich-text-editor';
import { TaskSortToggle } from './task-sort-toggle';
import { TASK_TOKENS } from './task-tokens';

type IssueCommentListProps = {
  issueId: string;
  baseUrl: string | undefined;
  comments: IssueCommentRow[];
  membersById: Map<string, MemberRow>;
  currentMemberId: string | null;
  highlightedCommentId: string | null;
  isBusy: boolean;
  onCreate: (input: { markdown: string; parentCommentId?: string }) => void;
  onUpdate: (commentId: string, markdown: string) => void;
  onDelete: (commentId: string) => void;
};

// One line at rest, growing with what is typed. The reference composer is a
// single row — box and button side by side — rather than a paragraph-sized
// box with its button on a line of its own underneath.
const COMPOSER_MIN_HEIGHT = 40;
// A reply is indented under the comment it answers rather than threaded into a
// tree: one level is what the data carries (parentCommentId) and what a panel
// this narrow can show without the text column collapsing.
const REPLY_INDENT = 34;
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
  isBusy,
  onCreate,
  onUpdate,
  onDelete,
}: IssueCommentListProps) => {
  const [draft, setDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );
  const [replyDraft, setReplyDraft] = useState('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);

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

    for (const comment of comments) {
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
  }, [comments, isNewestFirst]);

  const submitDraft = () => {
    if (draft.trim() === '') {
      return;
    }

    onCreate({ markdown: draft.trim() });
    setDraft('');
  };

  const submitReply = (parentCommentId: string) => {
    if (replyDraft.trim() === '') {
      return;
    }

    onCreate({ markdown: replyDraft.trim(), parentCommentId });
    setReplyDraft('');
    setReplyingToCommentId(null);
  };

  const renderComment = (comment: IssueCommentRow, isReply: boolean) => {
    const isEditing = editingCommentId === comment.id;
    // The route enforces the same rule; hiding the controls just stops the
    // UI from offering an action the server will refuse.
    const canEdit =
      currentMemberId !== null && comment.authorId === currentMemberId;
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
      <TaskFeedItem
        key={comment.id}
        anchorId={`comment-${comment.id}`}
        isHighlighted={comment.id === highlightedCommentId}
        authorName={authorName}
        authorEmail={author?.userEmail}
        avatarUrl={author?.avatarUrl}
        timestamp={comment.createdAt}
        actions={
          isEditing ? undefined : (
            <>
              <TaskCopyLinkButton
                url={buildIssueCommentUrl({
                  baseUrl,
                  issueId,
                  commentId: comment.id,
                })}
                label={t('Copy link to comment')}
              />
              {/* Replying to a reply would need a tree the data does not
                  carry, so a second level always answers the same root. */}
              {!isReply && (
                <TaskIconButton
                  label={t('Reply')}
                  isDisabled={isBusy}
                  onClick={() => {
                    setReplyingToCommentId(comment.id);
                    setReplyDraft('');
                  }}
                >
                  <IconArrowBackUp size={14} />
                </TaskIconButton>
              )}
              {canEdit && (
                <>
                  <TaskIconButton
                    label={t('Edit')}
                    isDisabled={isBusy}
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditDraft(readRichTextPlainValue(comment.bodyV2));
                    }}
                  >
                    <IconPencil size={14} />
                  </TaskIconButton>
                  <TaskIconButton
                    label={t('Delete')}
                    isDanger
                    isDisabled={isBusy}
                    onClick={() => onDelete(comment.id)}
                  >
                    <IconTrash size={14} />
                  </TaskIconButton>
                </>
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
              <TaskRichTextEditor
                value={replyDraft}
                onChange={setReplyDraft}
                placeholder={t('Write a reply…')}
                minHeight={COMPOSER_MIN_HEIGHT}
                shouldInsetBlockHandles
              />
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  paddingLeft: BLOCK_HANDLE_GUTTER,
                }}
              >
                <TaskButton
                  variant="primary"
                  size="small"
                  isDisabled={isBusy || replyDraft.trim() === ''}
                  onClick={() => submitReply(comment.id)}
                >
                  {t('Reply')}
                </TaskButton>
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
            <TaskRichTextEditor
              value={editDraft}
              onChange={setEditDraft}
              shouldInsetBlockHandles
            />
            <div
              style={{
                display: 'flex',
                gap: 6,
                paddingLeft: BLOCK_HANDLE_GUTTER,
              }}
            >
              <TaskButton
                variant="primary"
                size="small"
                isDisabled={isBusy || editDraft.trim() === ''}
                onClick={() => {
                  onUpdate(comment.id, editDraft.trim());
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
            value={readRichTextPlainValue(comment.bodyV2)}
            isReadOnly
          />
        )}
      </TaskFeedItem>
    );
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: `0 ${FEED_INLINE_INSET}px`,
      }}
    >
      {/* First, not last: the composer is the control people reach for most,
          and at the bottom of a long thread it sits below the fold.
          Stacked and indented to FEED_BODY_INDENT: the avatar is the byline of
          what is about to be written, and the box lines up with the text of
          every row beneath it instead of starting a column of its own. The
          indent also leaves the block handles their strip, so the editor needs
          no inset of its own. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
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
        {/* The button is under the box, not beside it: beside it the box was
            short by a button's width on every panel, and the two controls
            fought for the same line the moment the text wrapped. */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: 8,
            minWidth: 0,
            paddingLeft: FEED_BODY_INDENT,
          }}
        >
          <TaskRichTextEditor
            value={draft}
            onChange={setDraft}
            placeholder={t('Type a comment…')}
            minHeight={COMPOSER_MIN_HEIGHT}
          />
          <div style={{ display: 'flex' }}>
            <TaskButton
              variant="primary"
              isDisabled={isBusy || draft.trim() === ''}
              onClick={submitDraft}
            >
              {t('Comment')}
            </TaskButton>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            padding: `0 ${ROW_INLINE_PADDING}px`,
          }}
        >
          {t('No comments yet.')}
        </span>
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
