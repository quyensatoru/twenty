import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconClock, IconPencil, IconTrash } from 'twenty-ui/icon';

import { formatMinutes, parseMinutes } from '../../utils/format-minutes.util';
import { type MemberRow, type WorklogRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskButton } from './task-button';
import { TaskDateTimeInput } from './task-date-time-input';
import { TaskIconButton } from './task-icon-button';
import { TaskMarkdownEditor } from './task-markdown-editor';
import { TaskMarkdownView } from './task-markdown-view';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

type IssueWorklogListProps = {
  worklogs: WorklogRow[];
  membersById: Map<string, MemberRow>;
  currentMemberId: string | null;
  totalMinutes: number | null | undefined;
  isBusy: boolean;
  onCreate: (input: {
    timeSpentMinutes: number;
    description: string;
    startedAt: string;
  }) => void;
  onUpdateDescription: (worklogId: string, description: string) => void;
  onDelete: (worklogId: string) => void;
};

const formatDate = (value: string | null | undefined): string =>
  typeof value === 'string' ? new Date(value).toLocaleString() : '';

// datetime-local wants 'YYYY-MM-DDTHH:mm' in local time, which toISOString
// does not give — it is always UTC.
const toDateTimeLocalValue = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const IssueWorklogList = ({
  worklogs,
  membersById,
  currentMemberId,
  totalMinutes,
  isBusy,
  onCreate,
  onUpdateDescription,
  onDelete,
}: IssueWorklogListProps) => {
  const [timeSpent, setTimeSpent] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKey, setDescriptionKey] = useState(0);
  const [startedAt, setStartedAt] = useState(toDateTimeLocalValue(new Date()));
  const [editingWorklogId, setEditingWorklogId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const parsedMinutes = parseMinutes(timeSpent);

  const submit = () => {
    if (parsedMinutes === null || parsedMinutes <= 0) {
      return;
    }

    onCreate({
      timeSpentMinutes: parsedMinutes,
      description: description.trim(),
      startedAt: new Date(startedAt).toISOString(),
    });
    setTimeSpent('');
    setDescription('');
    setDescriptionKey((current) => current + 1);
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <header style={{ alignItems: 'baseline', display: 'flex', gap: 8 }}>
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
          }}
        >
          {t('Time spent')}: {formatMinutes(totalMinutes)}
        </span>
      </header>

      {worklogs.length === 0 && (
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
          }}
        >
          {t('No time logged yet.')}
        </span>
      )}

      {worklogs.map((worklog) => {
        const isOwn =
          currentMemberId !== null && worklog.memberId === currentMemberId;
        const isEditing = editingWorklogId === worklog.id;

        return (
          <article
            key={worklog.id}
            style={{
              borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: TASK_TOKENS.fontFamily,
              gap: 4,
              padding: '6px 0',
            }}
          >
            <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
              <span
                style={{
                  color: TASK_TOKENS.textPrimary,
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: 56,
                }}
              >
                {formatMinutes(worklog.timeSpentMinutes)}
              </span>
              <span
                style={{ color: TASK_TOKENS.textTertiary, flex: 1, fontSize: 11 }}
              >
                {readMemberName(membersById, worklog.memberId, t('Unknown'))}
              </span>
              <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 11 }}>
                {formatDate(worklog.startedAt)}
              </span>
              {isOwn && !isEditing && (
                <>
                  <TaskIconButton
                    label={t('Edit')}
                    isDisabled={isBusy}
                    onClick={() => {
                      setEditingWorklogId(worklog.id);
                      setEditDraft(worklog.description ?? '');
                    }}
                  >
                    <IconPencil size={14} />
                  </TaskIconButton>
                  <TaskIconButton
                    label={t('Delete')}
                    isDanger
                    isDisabled={isBusy}
                    onClick={() => onDelete(worklog.id)}
                  >
                    <IconTrash size={14} />
                  </TaskIconButton>
                </>
              )}
            </div>

            {isEditing ? (
              <>
                <TaskMarkdownEditor
                  ariaLabel={t('Edit worklog description')}
                  value={editDraft}
                  onChange={setEditDraft}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <TaskButton
                    variant="primary"
                    size="small"
                    isDisabled={isBusy}
                    onClick={() => {
                      onUpdateDescription(worklog.id, editDraft.trim());
                      setEditingWorklogId(null);
                    }}
                  >
                    {t('Save')}
                  </TaskButton>
                  <TaskButton
                    size="small"
                    onClick={() => setEditingWorklogId(null)}
                  >
                    {t('Cancel')}
                  </TaskButton>
                </div>
              </>
            ) : (
              <TaskMarkdownView markdown={worklog.description ?? ''} />
            )}
          </article>
        );
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <TaskTextInput
          ariaLabel={t('Time spent')}
          value={timeSpent}
          onChange={setTimeSpent}
          placeholder={t('e.g. 90 or 1h30m')}
          width={150}
          prefixIcon={<IconClock size={14} color={TASK_TOKENS.textTertiary} />}
        />
        <TaskDateTimeInput
          ariaLabel={t('Started at')}
          value={startedAt}
          onChange={setStartedAt}
        />
      </div>
      <TaskMarkdownEditor
        key={descriptionKey}
        ariaLabel={t('What you worked on')}
        value={description}
        onChange={setDescription}
        placeholder={t('Write what you worked on, in markdown…')}
        rows={3}
      />
      <div>
        <TaskButton
          variant="primary"
          isDisabled={isBusy || parsedMinutes === null || parsedMinutes <= 0}
          onClick={submit}
        >
          {t('Log time')}
        </TaskButton>
      </div>
    </section>
  );
};
