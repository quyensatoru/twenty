import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { readRichTextPlainValue } from '../../utils/read-rich-text-plain-value.util';
import {
  type IssueCommentRow,
  type MemberRow,
} from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskButton } from './task-button';
import { TaskTextArea } from './task-text-area';
import { TASK_TOKENS } from './task-tokens';

type IssueCommentListProps = {
  comments: IssueCommentRow[];
  membersById: Map<string, MemberRow>;
  currentMemberId: string | null;
  isBusy: boolean;
  onCreate: (markdown: string) => void;
  onUpdate: (commentId: string, markdown: string) => void;
  onDelete: (commentId: string) => void;
};

const formatTimestamp = (value: string | null | undefined): string =>
  typeof value === 'string' ? new Date(value).toLocaleString() : '';

export const IssueCommentList = ({
  comments,
  membersById,
  currentMemberId,
  isBusy,
  onCreate,
  onUpdate,
  onDelete,
}: IssueCommentListProps) => {
  const [draft, setDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const submitDraft = () => {
    if (draft.trim() === '') {
      return;
    }

    onCreate(draft.trim());
    setDraft('');
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2
        style={{
          color: TASK_TOKENS.textPrimary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 600,
          margin: 0,
        }}
      >
        {t('Comments')}
      </h2>

      {comments.map((comment) => {
        const isEditing = editingCommentId === comment.id;
        // The route enforces the same rule; hiding the controls just stops the
        // UI from offering an action the server will refuse.
        const canEdit =
          currentMemberId !== null && comment.authorId === currentMemberId;

        return (
          <article
            key={comment.id}
            style={{
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 8,
            }}
          >
            <header
              style={{ alignItems: 'center', display: 'flex', gap: 8 }}
            >
              <span
                style={{
                  color: TASK_TOKENS.textPrimary,
                  fontFamily: TASK_TOKENS.fontFamily,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {readMemberName(membersById, comment.authorId, t('Unknown'))}
              </span>
              <span
                style={{
                  color: TASK_TOKENS.textTertiary,
                  flex: 1,
                  fontFamily: TASK_TOKENS.fontFamily,
                  fontSize: 11,
                }}
              >
                {formatTimestamp(comment.createdAt)}
              </span>
              {canEdit && !isEditing && (
                <>
                  <TaskButton
                    variant="ghost"
                    isDisabled={isBusy}
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditDraft(readRichTextPlainValue(comment.bodyV2));
                    }}
                  >
                    {t('Edit')}
                  </TaskButton>
                  <TaskButton
                    variant="ghost"
                    isDisabled={isBusy}
                    onClick={() => onDelete(comment.id)}
                  >
                    {t('Delete')}
                  </TaskButton>
                </>
              )}
            </header>

            {isEditing ? (
              <>
                <TaskTextArea
                  ariaLabel={t('Edit comment')}
                  value={editDraft}
                  onChange={setEditDraft}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <TaskButton
                    variant="primary"
                    isDisabled={isBusy || editDraft.trim() === ''}
                    onClick={() => {
                      onUpdate(comment.id, editDraft.trim());
                      setEditingCommentId(null);
                    }}
                  >
                    {t('Save')}
                  </TaskButton>
                  <TaskButton onClick={() => setEditingCommentId(null)}>
                    {t('Cancel')}
                  </TaskButton>
                </div>
              </>
            ) : (
              <p
                style={{
                  color: TASK_TOKENS.textPrimary,
                  fontFamily: TASK_TOKENS.fontFamily,
                  fontSize: 13,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {readRichTextPlainValue(comment.bodyV2)}
              </p>
            )}
          </article>
        );
      })}

      <TaskTextArea
        ariaLabel={t('Write a comment')}
        value={draft}
        onChange={setDraft}
        placeholder={t('Write a comment…')}
      />
      <div>
        <TaskButton
          variant="primary"
          isDisabled={isBusy || draft.trim() === ''}
          onClick={submitDraft}
        >
          {t('Comment')}
        </TaskButton>
      </div>
    </section>
  );
};
