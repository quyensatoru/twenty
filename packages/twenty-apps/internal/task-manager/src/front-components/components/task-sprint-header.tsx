import { t } from 'twenty-sdk/front-component';
import { IconCalendarEvent, IconPencil, IconCalendarRepeat } from 'twenty-ui/icon';

import { type BoardSprint, type PageInset } from '../../types/task-board';
import { computeSprintRemainingDays } from '../../utils/compute-sprint-remaining-days.util';
import { formatSprintDateRange } from '../utils/format-sprint-date-range.util';
import { TaskButton } from './task-button';
import { TaskIconButton } from './task-icon-button';
import { TaskProgressBar } from './task-progress-bar';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type TaskSprintHeaderProps = {
  // The page's side padding, narrower on a phone.
  inset: PageInset;
  sprint: BoardSprint;
  canWrite: boolean;
  isCompact: boolean;
  progress: { totalCount: number; doneCount: number; startedCount: number };
  onComplete: () => void;
  onEdit: () => void;
  onViewAllIssues: () => void;
};

const readRemainingLabel = (sprint: BoardSprint): string | null => {
  const remaining = computeSprintRemainingDays({
    endDate: sprint.endDate,
    now: new Date(),
  });

  if (remaining === null) {
    return null;
  }

  if (remaining.isOverdue) {
    return t('Overdue');
  }

  return remaining.remainingDays === 1
    ? t('1 day left')
    : t('{count} days left', { count: remaining.remainingDays });
};

const STRIP_STYLE = (inset: PageInset) =>
  ({
    alignItems: 'center',
    background: TASK_TOKENS.backgroundSecondary,
    borderBottom: `1px solid ${TASK_TOKENS.border}`,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    flexWrap: 'wrap',
    fontFamily: TASK_TOKENS.fontFamily,
    fontSize: 13,
    gap: '8px 14px',
    minHeight: 44,
    padding: `6px ${inset.right}px 6px ${inset.left}px`,
  }) as const;

// The strip over a board running a sprint: name, goal, dates, days left, how
// far the work has moved, and the way out (complete it, or look past it).
export const TaskSprintHeader = ({
  inset,
  sprint,
  canWrite,
  isCompact,
  progress,
  onComplete,
  onEdit,
  onViewAllIssues,
}: TaskSprintHeaderProps) => {
  const dateRange = formatSprintDateRange({
    startDate: sprint.startDate,
    endDate: sprint.endDate,
  });
  const remainingLabel = readRemainingLabel(sprint);
  const isOverdue =
    computeSprintRemainingDays({ endDate: sprint.endDate, now: new Date() })
      ?.isOverdue === true;
  const todoCount = Math.max(
    0,
    progress.totalCount - progress.doneCount - progress.startedCount,
  );
  const hasGoal = typeof sprint.goal === 'string' && sprint.goal !== '';

  return (
    <div style={STRIP_STYLE(inset)}>
      <span
        style={{
          alignItems: 'center',
          color: TASK_TOKENS.textPrimary,
          display: 'inline-flex',
          fontWeight: 600,
          gap: 8,
          minWidth: 0,
        }}
      >
        <IconCalendarRepeat size={15} color={TASK_TOKENS.textTertiary} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sprint.name ?? t('Active sprint')}
        </span>
        <span
          style={{
            background: readTagColor('green').background,
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            color: readTagColor('green').text,
            fontSize: 11,
            fontWeight: 600,
            padding: '1px 6px',
          }}
        >
          {t('Active')}
        </span>
      </span>
      {(dateRange !== null || remainingLabel !== null) && (
        <span
          style={{
            alignItems: 'center',
            color: isOverdue ? TASK_TOKENS.textDanger : TASK_TOKENS.textTertiary,
            display: 'inline-flex',
            fontVariantNumeric: 'tabular-nums',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <IconCalendarEvent size={14} />
          {[dateRange, remainingLabel]
            .filter((part) => part !== null)
            .join(' · ')}
        </span>
      )}
      {hasGoal && !isCompact && (
        <span
          title={sprint.goal ?? undefined}
          style={{
            color: TASK_TOKENS.textSecondary,
            flex: '0 1 320px',
            minWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sprint.goal}
        </span>
      )}
      <span style={{ flex: 1 }} />
      {!isCompact && progress.totalCount > 0 && (
        <span
          style={{
            alignItems: 'center',
            color: TASK_TOKENS.textTertiary,
            display: 'inline-flex',
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            gap: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <TaskProgressBar
            width={140}
            segments={[
              {
                value: progress.doneCount,
                color: readTagColor('green').text,
                label: t('Done'),
              },
              {
                value: progress.startedCount,
                color: readTagColor('orange').text,
                label: t('In progress'),
              },
            ]}
            total={progress.totalCount}
          />
          <span>
            {t('{done} done · {started} in progress · {todo} to do', {
              done: progress.doneCount,
              started: progress.startedCount,
              todo: todoCount,
            })}
          </span>
        </span>
      )}
      <span style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}>
        <TaskButton variant="ghost" size="small" onClick={onViewAllIssues}>
          {t('All issues')}
        </TaskButton>
        {canWrite && (
          <>
            <TaskIconButton label={t('Edit sprint')} onClick={onEdit}>
              <IconPencil size={14} />
            </TaskIconButton>
            <TaskButton size="small" onClick={onComplete}>
              {t('Complete sprint')}
            </TaskButton>
          </>
        )}
      </span>
    </div>
  );
};

type TaskNoActiveSprintBannerProps = {
  inset: PageInset;
  onOpenBacklog: () => void;
};

// What a sprint board says between sprints. The board still shows every
// issue, so a project that does not run sprints keeps working.
export const TaskNoActiveSprintBanner = ({
  inset,
  onOpenBacklog,
}: TaskNoActiveSprintBannerProps) => (
  <div style={{ ...STRIP_STYLE(inset), color: TASK_TOKENS.textSecondary }}>
    <IconCalendarRepeat size={15} color={TASK_TOKENS.textTertiary} />
    <span style={{ flex: 1 }}>
      {t('No active sprint. Showing every issue in the project.')}
    </span>
    <TaskButton size="small" variant="ghost" onClick={onOpenBacklog}>
      {t('Plan a sprint')}
    </TaskButton>
  </div>
);
