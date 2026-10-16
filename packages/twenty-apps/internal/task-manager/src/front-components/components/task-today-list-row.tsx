import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconFocusCentered } from 'twenty-ui/icon';

import { type IssueRow } from '../../types/task-manager-rows';
import { type TaskTodayData } from '../../types/task-today';
import { buildRecordUrl } from '../utils/build-record-url.util';
import { toDateInputValue } from '../utils/sprint-dates.util';
import { TaskIconButton } from './task-icon-button';
import { TaskPriorityGlyph } from './task-priority-glyph';
import { TaskPropertyMenu } from './task-property-menu';
import { readStatusGlyph, TaskStatusIcon } from './task-status-icon';
import { TASK_TOKENS } from './task-tokens';
import { TaskProjectBadge } from './task-toolbar';

type TaskTodayListRowProps = {
  issue: IssueRow;
  data: TaskTodayData;
  baseUrl: string | undefined;
  isMobile: boolean;
  isDisabled: boolean;
  isSaving: boolean;
  isFocused: boolean;
  isDeparting: boolean;
  onFocusIssue: () => void;
  onChangeStatus: (issueId: string, statusId: string) => void;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Days relative to the page's own day, which the server computed in the
// reader's time zone: "Yesterday" beats a date when the point is urgency.
const readRelativeDueLabel = (
  dueDate: string | null | undefined,
  day: string,
): string | null => {
  if (typeof dueDate !== 'string' || dueDate === '') {
    return null;
  }

  const dueDay = toDateInputValue(dueDate);
  const delta = Math.round(
    (new Date(`${dueDay}T12:00:00`).getTime() -
      new Date(`${day}T12:00:00`).getTime()) /
      DAY_IN_MS,
  );

  if (delta === 0) {
    return t('Today');
  }

  if (delta === 1) {
    return t('Tomorrow');
  }

  if (delta === -1) {
    return t('Yesterday');
  }

  if (delta < 0 && delta > -7) {
    return t('{count} days ago', { count: -delta });
  }

  return new Date(`${dueDay}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

// One issue of My work on a single line: priority, status (changed in
// place), key and title, its project and how its due date stands today.
export const TaskTodayListRow = ({
  issue,
  data,
  baseUrl,
  isMobile,
  isDisabled,
  isSaving,
  isFocused,
  isDeparting,
  onFocusIssue,
  onChangeStatus,
}: TaskTodayListRowProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const project = data.projects.find(
    (candidate) => candidate.id === issue.projectId,
  );
  const projectStatuses = data.issueStatuses.filter(
    (candidate) => candidate.projectId === issue.projectId,
  );
  const status = data.issueStatuses.find(
    (candidate) => candidate.id === issue.statusId,
  );
  const doneStatus = projectStatuses.find(
    (candidate) => candidate.category === 'DONE',
  );
  const isDone = status?.category === 'DONE';
  const isOverdue =
    !isDone &&
    typeof issue.dueDate === 'string' &&
    toDateInputValue(issue.dueDate) < data.day;
  const dueLabel = readRelativeDueLabel(issue.dueDate, data.day);
  const canWrite = project?.canWrite === true && projectStatuses.length > 0;
  const issueLabel = issue.issueKey || issue.title || t('Issue');
  const statusIcon = (
    <TaskStatusIcon
      glyph={readStatusGlyph(status, projectStatuses)}
      color={status?.color}
      title={status?.name ?? t('No status')}
    />
  );

  return (
    <li
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isFocused
          ? TASK_TOKENS.accentSoft
          : isHovered
            ? TASK_TOKENS.backgroundHover
            : 'transparent',
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        boxSizing: 'border-box',
        display: 'flex',
        gap: 8,
        listStyle: 'none',
        minHeight: 40,
        opacity: isDeparting ? 0 : isSaving ? 0.6 : 1,
        padding: isMobile ? '0 12px' : '0 20px 0 18px',
        transform: isDeparting ? 'translateX(12px)' : 'none',
        transition: 'opacity 320ms ease, transform 320ms ease',
      }}
    >
      {!isMobile && (
        <span style={{ display: 'inline-flex', justifyContent: 'center', width: 24 }}>
          <TaskPriorityGlyph priority={issue.priority} shouldShowEmpty />
        </span>
      )}
      {canWrite ? (
        <TaskPropertyMenu
          label={`${t('Change status')}: ${issueLabel}`}
          trigger={statusIcon}
          isDisabled={isDisabled}
          options={projectStatuses.map((candidate) => ({
            value: candidate.id,
            label: candidate.name ?? t('Status'),
            icon: (
              <TaskStatusIcon
                glyph={readStatusGlyph(candidate, projectStatuses)}
                color={candidate.color}
              />
            ),
          }))}
          selectedValue={issue.statusId ?? null}
          onSelect={(statusId) => onChangeStatus(issue.id, statusId)}
        />
      ) : (
        <span style={{ display: 'inline-flex', justifyContent: 'center', width: 24 }}>
          {statusIcon}
        </span>
      )}
      <a
        href={buildRecordUrl({
          baseUrl,
          objectNameSingular: 'issue',
          recordId: issue.id,
        })}
        style={{
          alignItems: 'center',
          alignSelf: 'stretch',
          color: 'inherit',
          display: 'flex',
          flex: 1,
          gap: 10,
          minWidth: 0,
          textDecoration: 'none',
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            flexShrink: 0,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            minWidth: isMobile ? 0 : 60,
          }}
        >
          {issue.issueKey ?? ''}
        </span>
        <span
          style={{
            color: isDone ? TASK_TOKENS.textTertiary : TASK_TOKENS.textPrimary,
            flex: 1,
            fontSize: 13,
            minWidth: 0,
            overflow: 'hidden',
            textDecoration: isDone ? 'line-through' : 'none',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue.title ?? t('(No title)')}
        </span>
      </a>
      {!isMobile && project !== undefined && (
        <span
          title={project.name ?? undefined}
          style={{
            alignItems: 'center',
            color: TASK_TOKENS.textTertiary,
            display: 'inline-flex',
            flexShrink: 0,
            fontSize: 12,
            gap: 6,
            maxWidth: 160,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <TaskProjectBadge projectKey={project.key ?? null} size={16} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.name}
          </span>
        </span>
      )}
      <span
        style={{
          color: isOverdue ? TASK_TOKENS.textDanger : TASK_TOKENS.textTertiary,
          flexShrink: 0,
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: isOverdue ? 500 : 400,
          textAlign: 'right',
          width: isMobile ? 64 : 84,
        }}
      >
        {dueLabel ?? t('No date')}
      </span>
      {/* Faded rather than hidden, so the actions stay reachable from the
          keyboard and to assistive tech. */}
      <span
        style={{
          display: 'inline-flex',
          gap: 2,
          opacity: isHovered || isFocused ? 1 : 0,
          transition: 'opacity 120ms ease',
        }}
      >
        <TaskIconButton
          label={`${t('Focus on')}: ${issueLabel}`}
          onClick={onFocusIssue}
        >
          <IconFocusCentered size={14} />
        </TaskIconButton>
        {canWrite && doneStatus !== undefined && !isDone && (
          <TaskIconButton
            label={`${t('Mark done')}: ${issueLabel}`}
            isDisabled={isDisabled}
            onClick={() => onChangeStatus(issue.id, doneStatus.id)}
          >
            <IconCheck size={14} />
          </TaskIconButton>
        )}
      </span>
    </li>
  );
};
