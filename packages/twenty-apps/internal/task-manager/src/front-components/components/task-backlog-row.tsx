import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconHierarchy2 } from 'twenty-ui/icon';

import { type BoardIssue } from '../../types/task-board';
import { TaskAvatar } from './task-avatar';
import { IssueTypeGlyph, UnassignedAvatar } from './task-board-card';
import { TaskPriorityGlyph } from './task-priority-glyph';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type TaskBacklogRowProps = {
  issue: BoardIssue;
  epicName: string | null;
  epicColor: string | null;
  statusName: string | null;
  statusColor: string | null;
  isDone: boolean;
  assigneeName: string | null;
  assigneeAvatarUrl?: string | null;
  subtaskCount: number;
  isSelected: boolean;
  isDragging: boolean;
  // A drop here lands the dragged row just above this one.
  isDropTarget: boolean;
  canDrag: boolean;
  // Phone width: key, title, status and owner only.
  isCompact: boolean;
  onOpen: () => void;
  onDragStartRow: () => void;
  onDragEndRow: () => void;
  onDragOverRow: () => void;
  onDropRow: () => void;
};

// One line of Jira's backlog: type, key, summary, then epic, status, points
// and owner on the right. The whole row opens the issue; dragging it ranks it.
export const TaskBacklogRow = ({
  issue,
  epicName,
  epicColor,
  statusName,
  statusColor,
  isDone,
  assigneeName,
  assigneeAvatarUrl,
  subtaskCount,
  isSelected,
  isDragging,
  isDropTarget,
  canDrag,
  isCompact,
  onOpen,
  onDragStartRow,
  onDragEndRow,
  onDragOverRow,
  onDropRow,
}: TaskBacklogRowProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canDrag}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onOpen();
        }
      }}
      onDragStart={(event) => {
        // Same guard as the board card: the sandbox proxy has no
        // dataTransfer, so the dragged id travels on component state.
        try {
          event.dataTransfer?.setData('text/plain', issue.id);

          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
          }
        } catch {
          // Sandbox proxy: state carries the payload.
        }

        onDragStartRow();
      }}
      onDragEnd={onDragEndRow}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverRow();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropRow();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isSelected
          ? TASK_TOKENS.accentSoft
          : isHovered
            ? TASK_TOKENS.backgroundHover
            : TASK_TOKENS.background,
        borderTop: `2px solid ${isDropTarget ? TASK_TOKENS.accent : 'transparent'}`,
        boxSizing: 'border-box',
        cursor: isDragging ? 'grabbing' : 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        minHeight: 38,
        opacity: isDragging ? 0.5 : 1,
        padding: isCompact ? '0 8px' : '0 12px',
      }}
    >
      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
        <IssueTypeGlyph issueType={issue.issueType ?? null} />
      </span>
      <span
        style={{
          color: TASK_TOKENS.textTertiary,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 500,
          textDecoration: isDone ? 'line-through' : 'none',
        }}
      >
        {issue.issueKey ?? ''}
      </span>
      <span
        style={{
          color: TASK_TOKENS.textPrimary,
          flex: 1,
          fontSize: 13,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {issue.title ?? t('(No title)')}
      </span>
      {!isCompact && subtaskCount > 0 && (
        <span
          title={t('{count} subtasks', { count: subtaskCount })}
          style={{
            alignItems: 'center',
            color: TASK_TOKENS.textTertiary,
            display: 'inline-flex',
            flexShrink: 0,
            fontSize: 12,
            gap: 2,
          }}
        >
          <IconHierarchy2 size={12} />
          {subtaskCount}
        </span>
      )}
      {!isCompact && epicName !== null && (
        <span style={{ display: 'inline-flex', flexShrink: 0, maxWidth: 160 }}>
          <TaskTag color={epicColor ?? 'purple'}>{epicName}</TaskTag>
        </span>
      )}
      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
        {statusName === null ? (
          <TaskTag color="gray">{t('No status')}</TaskTag>
        ) : (
          <TaskTag color={statusColor}>{statusName}</TaskTag>
        )}
      </span>
      {!isCompact && <TaskPriorityGlyph priority={issue.priority} />}
      <span
        title={t('Story points')}
        style={{
          background: TASK_TOKENS.backgroundTertiary,
          borderRadius: 10,
          color: TASK_TOKENS.textSecondary,
          flexShrink: 0,
          fontSize: 11,
          lineHeight: '18px',
          minWidth: 18,
          padding: '0 6px',
          textAlign: 'center',
          visibility: typeof issue.storyPoints === 'number' ? 'visible' : 'hidden',
        }}
      >
        {issue.storyPoints ?? '-'}
      </span>
      {assigneeName === null ? (
        <UnassignedAvatar size={22} />
      ) : (
        <span title={assigneeName} style={{ display: 'inline-flex', flexShrink: 0 }}>
          <TaskAvatar name={assigneeName} avatarUrl={assigneeAvatarUrl} size={22} />
        </span>
      )}
    </div>
  );
};
