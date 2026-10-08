import { t } from 'twenty-sdk/front-component';
import { IconCalendarEvent } from 'twenty-ui/icon';

import { type BoardSprint, type PageInset } from '../../types/task-board';
import { computeSprintRemainingDays } from '../../utils/compute-sprint-remaining-days.util';
import { formatSprintDateRange } from '../utils/format-sprint-date-range.util';
import { TaskButton } from './task-button';
import { TASK_TOKENS } from './task-tokens';

type TaskSprintHeaderProps = {
  // The page's side padding, narrower on a phone.
  inset: PageInset;
  sprint: BoardSprint;
  canWrite: boolean;
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

// The strip over a Jira board running a sprint: its name, goal and dates, the
// days left, and the way out (complete it, or look past it).
export const TaskSprintHeader = ({
  inset,
  sprint,
  canWrite,
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

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: `0 ${inset.right}px 12px ${inset.left}px`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {sprint.name ?? t('Active sprint')}
        </span>
        {typeof sprint.goal === 'string' && sprint.goal !== '' && (
          <span
            style={{
              color: TASK_TOKENS.textSecondary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
            }}
          >
            {sprint.goal}
          </span>
        )}
      </div>
      <span style={{ flex: 1 }} />
      {(dateRange !== null || remainingLabel !== null) && (
        <span
          style={{
            alignItems: 'center',
            color: isOverdue ? TASK_TOKENS.textDanger : TASK_TOKENS.textSecondary,
            display: 'inline-flex',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            gap: 6,
          }}
        >
          <IconCalendarEvent size={14} />
          {[dateRange, remainingLabel].filter((part) => part !== null).join(' · ')}
        </span>
      )}
      <TaskButton variant="ghost" onClick={onViewAllIssues}>
        {t('View all issues')}
      </TaskButton>
      {canWrite && (
        <>
          <TaskButton onClick={onEdit}>{t('Edit sprint')}</TaskButton>
          <TaskButton variant="primary" onClick={onComplete}>
            {t('Complete sprint')}
          </TaskButton>
        </>
      )}
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
  <div
    style={{
      alignItems: 'center',
      background: TASK_TOKENS.backgroundSecondary,
      border: `1px solid ${TASK_TOKENS.borderLight}`,
      borderRadius: TASK_TOKENS.radiusSmall,
      color: TASK_TOKENS.textSecondary,
      display: 'flex',
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      gap: 8,
      margin: `0 ${inset.right}px 12px ${inset.left}px`,
      padding: '6px 12px',
    }}
  >
    <IconCalendarEvent size={14} />
    <span style={{ flex: 1 }}>
      {t('No active sprint. Plan and start one from the backlog.')}
    </span>
    <TaskButton size="small" onClick={onOpenBacklog}>
      {t('Go to backlog')}
    </TaskButton>
  </div>
);
