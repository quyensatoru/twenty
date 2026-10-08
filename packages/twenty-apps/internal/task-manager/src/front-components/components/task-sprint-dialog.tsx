import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import {
  START_SPRINT_ROUTE_PATH,
  UPDATE_SPRINT_ROUTE_PATH,
} from '../../constants/route-paths';
import { type BoardSprint } from '../../types/task-board';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import {
  addWeeksToDateInput,
  dateInputToIso,
  toDateInputValue,
} from '../utils/sprint-dates.util';
import { TaskBoardSelect } from './task-board-select';
import { TaskButton } from './task-button';
import { TaskDialogField, TaskDialogFrame } from './task-dialog-frame';
import { TaskStatusLine } from './task-status-line';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

const CUSTOM_DURATION = 'CUSTOM';
const DEFAULT_DURATION_WEEKS = 2;

type TaskSprintDialogProps = {
  mode: 'start' | 'edit';
  sprint: BoardSprint;
  // Shown when starting, as Jira does: "N issues will be included".
  issueCount: number;
  onClose: () => void;
  onSaved: () => void;
};

// Jira's Start sprint / Edit sprint form: name, duration, dates and goal. A
// duration in weeks drives the end date until the end is edited by hand.
export const TaskSprintDialog = ({
  mode,
  sprint,
  issueCount,
  onClose,
  onSaved,
}: TaskSprintDialogProps) => {
  const initialStartDate =
    toDateInputValue(sprint.startDate) ||
    (mode === 'start' ? toDateInputValue(new Date()) : '');
  const initialEndDate =
    toDateInputValue(sprint.endDate) ||
    (mode === 'start' && initialStartDate !== ''
      ? addWeeksToDateInput(initialStartDate, DEFAULT_DURATION_WEEKS)
      : '');
  const [name, setName] = useState(sprint.name ?? '');
  const [goal, setGoal] = useState(sprint.goal ?? '');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [duration, setDuration] = useState(
    mode === 'start' && typeof sprint.endDate !== 'string'
      ? String(DEFAULT_DURATION_WEEKS)
      : CUSTOM_DURATION,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStartDate = (value: string) => {
    setStartDate(value);

    if (duration !== CUSTOM_DURATION && value !== '') {
      setEndDate(addWeeksToDateInput(value, Number(duration)));
    }
  };

  const changeDuration = (value: string) => {
    setDuration(value);

    if (value !== CUSTOM_DURATION && startDate !== '') {
      setEndDate(addWeeksToDateInput(startDate, Number(value)));
    }
  };

  const save = async () => {
    const startIso = startDate === '' ? null : dateInputToIso(startDate, 'start');
    const endIso = endDate === '' ? null : dateInputToIso(endDate, 'end');

    if (mode === 'start' && (startIso === null || endIso === null)) {
      setError(t('A sprint needs a start date and an end date.'));

      return;
    }

    if (startIso !== null && endIso !== null && endIso <= startIso) {
      setError(t('The end date must be after the start date.'));

      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (mode === 'start') {
        await postAppRoute(START_SPRINT_ROUTE_PATH, {
          sprintId: sprint.id,
          name: name.trim(),
          goal: goal.trim() === '' ? null : goal.trim(),
          startDate: startIso,
          endDate: endIso,
        });
      } else {
        await postAppRoute(UPDATE_SPRINT_ROUTE_PATH, {
          sprintId: sprint.id,
          data: {
            ...(name.trim() === '' ? {} : { name: name.trim() }),
            goal: goal.trim() === '' ? null : goal.trim(),
            startDate: startIso,
            endDate: endIso,
          },
        });
      }

      void enqueueSnackbar({
        message:
          mode === 'start' ? t('Sprint started.') : t('Sprint updated.'),
        variant: 'success',
      });
      onSaved();
    } catch (saveError) {
      setError(readErrorText(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TaskDialogFrame
      title={
        mode === 'start'
          ? t('Start sprint')
          : t('Edit sprint: {name}', { name: sprint.name ?? '' })
      }
      onClose={onClose}
      footer={
        <>
          <TaskButton variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </TaskButton>
          <TaskButton
            variant="primary"
            isDisabled={isSaving}
            onClick={() => void save()}
          >
            {mode === 'start' ? t('Start') : t('Update')}
          </TaskButton>
        </>
      }
    >
      {mode === 'start' && (
        <span style={{ color: TASK_TOKENS.textSecondary, fontSize: 13 }}>
          {issueCount === 1
            ? t('1 issue will be included in this sprint.')
            : t('{count} issues will be included in this sprint.', {
                count: issueCount,
              })}
        </span>
      )}
      <TaskDialogField label={t('Sprint name')}>
        <TaskTextInput
          ariaLabel={t('Sprint name')}
          value={name}
          onChange={setName}
          onEnter={() => void save()}
          onEscape={onClose}
          shouldAutoFocus
        />
      </TaskDialogField>
      <TaskDialogField label={t('Duration')}>
        <TaskBoardSelect
          ariaLabel={t('Duration')}
          width="100%"
          value={duration}
          options={[
            { value: '1', label: t('1 week') },
            { value: '2', label: t('2 weeks') },
            { value: '3', label: t('3 weeks') },
            { value: '4', label: t('4 weeks') },
            { value: CUSTOM_DURATION, label: t('Custom') },
          ]}
          onChange={changeDuration}
        />
      </TaskDialogField>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <TaskDialogField label={t('Start date')}>
            <TaskTextInput
              ariaLabel={t('Start date')}
              type="date"
              value={startDate}
              onChange={changeStartDate}
            />
          </TaskDialogField>
        </div>
        <div style={{ flex: 1 }}>
          <TaskDialogField label={t('End date')}>
            <TaskTextInput
              ariaLabel={t('End date')}
              type="date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                setDuration(CUSTOM_DURATION);
              }}
            />
          </TaskDialogField>
        </div>
      </div>
      <TaskDialogField label={t('Sprint goal')}>
        <TaskTextInput
          ariaLabel={t('Sprint goal')}
          value={goal}
          onChange={setGoal}
          onEscape={onClose}
        />
      </TaskDialogField>
      <TaskStatusLine text={error} tone="danger" />
    </TaskDialogFrame>
  );
};
