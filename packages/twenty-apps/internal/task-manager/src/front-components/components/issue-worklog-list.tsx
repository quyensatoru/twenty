import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { formatMinutes, parseMinutes } from '../../utils/format-minutes.util';
import { type MemberRow, type WorklogRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskButton } from './task-button';
import { TaskTextArea } from './task-text-area';
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
  onDelete,
}: IssueWorklogListProps) => {
  const [timeSpent, setTimeSpent] = useState('');
  const [description, setDescription] = useState('');
  const [startedAt, setStartedAt] = useState(toDateTimeLocalValue(new Date()));

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
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <header style={{ alignItems: 'baseline', display: 'flex', gap: 8 }}>
        <h2
          style={{
            color: TASK_TOKENS.textPrimary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {t('Worklogs')}
        </h2>
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

      {worklogs.map((worklog) => (
        <article
          key={worklog.id}
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            fontFamily: TASK_TOKENS.fontFamily,
            gap: 8,
            padding: '6px 0',
          }}
        >
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
            style={{
              color: TASK_TOKENS.textPrimary,
              flex: 1,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {worklog.description ?? ''}
          </span>
          <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 11 }}>
            {readMemberName(membersById, worklog.memberId, t('Unknown'))}
          </span>
          <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 11 }}>
            {formatDate(worklog.startedAt)}
          </span>
          {currentMemberId !== null && worklog.memberId === currentMemberId && (
            <TaskButton
              variant="ghost"
              isDisabled={isBusy}
              onClick={() => onDelete(worklog.id)}
            >
              {t('Delete')}
            </TaskButton>
          )}
        </article>
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <TaskTextInput
          ariaLabel={t('Time spent')}
          value={timeSpent}
          onChange={setTimeSpent}
          placeholder={t('e.g. 90 or 1h30m')}
          width={140}
        />
        <TaskTextInput
          ariaLabel={t('Started at')}
          type="datetime-local"
          value={startedAt}
          onChange={setStartedAt}
          width={200}
        />
      </div>
      <TaskTextArea
        ariaLabel={t('What you worked on')}
        value={description}
        onChange={setDescription}
        placeholder={t('Write what you worked on…')}
        rows={2}
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
