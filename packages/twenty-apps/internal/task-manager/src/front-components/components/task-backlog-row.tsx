import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconCalendarEvent,
  IconGripVertical,
  IconHierarchy2,
} from 'twenty-ui/icon';

import { type BoardIssue, type PageInset } from '../../types/task-board';
import { readShortDate, readIsOverdue } from '../utils/read-due-date.util';
import { TaskAvatar } from './task-avatar';
import { UnassignedAvatar } from './task-board-card';
import { TaskCheckbox } from './task-checkbox';
import { TaskChip, TaskColorDot } from './task-chip';
import { TaskPriorityGlyph } from './task-priority-glyph';
import {
  TaskPropertyMenu,
  type TaskPropertyMenuOption,
} from './task-property-menu';
import { TaskStatusIcon, type TaskStatusGlyph } from './task-status-icon';
import { readTagColor, TASK_TOKENS } from './task-tokens';

export type TaskBacklogRowEditing = {
  statusOptions: readonly TaskPropertyMenuOption[];
  priorityOptions: readonly TaskPropertyMenuOption[];
  assigneeOptions: readonly TaskPropertyMenuOption[];
  onChangeStatus: (statusId: string) => void;
  onChangePriority: (priority: string) => void;
  onChangeAssignee: (assigneeId: string) => void;
};

type TaskBacklogRowProps = {
  issue: BoardIssue;
  epicName: string | null;
  epicColor: string | null;
  statusName: string | null;
  statusColor: string | null;
  statusGlyph: TaskStatusGlyph;
  isDone: boolean;
  assigneeName: string | null;
  assigneeAvatarUrl?: string | null;
  subtaskCount: number;
  // Open in the drawer; unrelated to the bulk-action checkbox.
  isSelected: boolean;
  isChecked: boolean;
  // Some row is checked, so every checkbox shows, not only the hovered one.
  isSelectionActive: boolean;
  // Absent when nothing can be done to a selection: no checkbox is drawn.
  onToggleChecked: ((isRange: boolean) => void) | null;
  isDragging: boolean;
  // A drop here lands the dragged row just above this one.
  isDropTarget: boolean;
  canDrag: boolean;
  // Phone width: status, key, title and owner only.
  isCompact: boolean;
  inset: PageInset;
  // Absent for a reader without write access: the glyphs show, nothing edits.
  editing: TaskBacklogRowEditing | null;
  onOpen: () => void;
  onDragStartRow: () => void;
  onDragEndRow: () => void;
  onDragOverRow: () => void;
  onDropRow: () => void;
};

export const UNASSIGNED_OPTION_VALUE = 'UNASSIGNED';

// Wide enough for a short epic name; a longer one ellipsizes inside it.
const EPIC_SLOT_WIDTH = 128;

// One line of the backlog, in fixed columns so status, points, due date and
// owner line up down the whole list whatever the title or epic measures.
// Priority, status and owner change in place; the rest of the row opens it.
export const TaskBacklogRow = ({
  issue,
  epicName,
  epicColor,
  statusName,
  statusColor,
  statusGlyph,
  isDone,
  assigneeName,
  assigneeAvatarUrl,
  subtaskCount,
  isSelected,
  isChecked,
  isSelectionActive,
  onToggleChecked,
  isDragging,
  isDropTarget,
  canDrag,
  isCompact,
  inset,
  editing,
  onOpen,
  onDragStartRow,
  onDragEndRow,
  onDragOverRow,
  onDropRow,
}: TaskBacklogRowProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const dueLabel = readShortDate(issue.dueDate);
  const isOverdue = readIsOverdue(issue.dueDate, isDone);
  const statusLabel = statusName ?? t('No status');

  const priorityGlyph = (
    <TaskPriorityGlyph priority={issue.priority} shouldShowEmpty />
  );
  const statusIcon = (
    <TaskStatusIcon
      glyph={statusGlyph}
      color={statusColor}
      title={statusLabel}
    />
  );
  const assigneeAvatar =
    assigneeName === null ? (
      <UnassignedAvatar size={20} />
    ) : (
      <TaskAvatar
        name={assigneeName}
        avatarUrl={assigneeAvatarUrl}
        size={20}
        shouldShowTitle={false}
      />
    );

  return (
    <div
      draggable={canDrag}
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
        background:
          isSelected || isChecked
            ? TASK_TOKENS.accentSoft
            : isHovered
              ? TASK_TOKENS.backgroundHover
              : TASK_TOKENS.background,
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        boxShadow: isDropTarget
          ? `inset 0 2px 0 ${TASK_TOKENS.accent}`
          : 'none',
        boxSizing: 'border-box',
        cursor: isDragging ? 'grabbing' : 'default',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 6,
        minHeight: 38,
        opacity: isDragging ? 0.5 : 1,
        padding: `0 ${inset.right}px 0 ${Math.max(inset.left - 14, 2)}px`,
      }}
    >
      <span
        aria-hidden
        style={{
          color: TASK_TOKENS.textLight,
          cursor: canDrag ? 'grab' : 'default',
          display: 'inline-flex',
          flexShrink: 0,
          visibility: canDrag && isHovered ? 'visible' : 'hidden',
          width: 12,
        }}
      >
        <IconGripVertical size={12} />
      </span>
      {!isCompact && onToggleChecked !== null && (
        // Always attached and only hidden: a handler added once the row is
        // hovered could be left behind by the sandbox after it is removed.
        <button
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          aria-label={t('Select {key}', { key: issue.issueKey ?? '' })}
          onClick={(event) => onToggleChecked(event.shiftKey === true)}
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            flexShrink: 0,
            height: 24,
            justifyContent: 'center',
            padding: 0,
            visibility:
              isChecked || isSelectionActive || isHovered
                ? 'visible'
                : 'hidden',
            width: 16,
          }}
        >
          <TaskCheckbox isChecked={isChecked} />
        </button>
      )}
      {!isCompact &&
        (editing === null ? (
          <span
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              width: 24,
            }}
          >
            {priorityGlyph}
          </span>
        ) : (
          <TaskPropertyMenu
            label={t('Change priority')}
            trigger={priorityGlyph}
            options={editing.priorityOptions}
            selectedValue={issue.priority ?? null}
            onSelect={editing.onChangePriority}
          />
        ))}
      {editing === null ? (
        <span
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            width: 24,
          }}
        >
          {statusIcon}
        </span>
      ) : (
        <TaskPropertyMenu
          label={t('Change status')}
          trigger={statusIcon}
          options={editing.statusOptions}
          selectedValue={issue.statusId ?? null}
          onSelect={editing.onChangeStatus}
        />
      )}
      <button
        type="button"
        onClick={onOpen}
        title={`${issue.issueKey ?? ''} ${issue.title ?? ''}`.trim()}
        style={{
          alignItems: 'center',
          alignSelf: 'stretch',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          flex: 1,
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 10,
          minWidth: 0,
          padding: '0 4px',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            flexShrink: 0,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            minWidth: isCompact ? 0 : 56,
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
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue.title ?? t('(No title)')}
        </span>
        {!isCompact && subtaskCount > 0 && (
          <TaskChip
            title={t('{count} subtasks', { count: subtaskCount })}
            icon={<IconHierarchy2 size={11} />}
          >
            {subtaskCount}
          </TaskChip>
        )}
        {!isCompact && (
          // A fixed slot, so points, due date and owner line up whether or not
          // the row has an epic or a subtask count. Still inside the open
          // button: a click on the epic opens the issue as before. A grid
          // track, unlike a flex row, lets the chip shrink and ellipsize.
          <span
            style={{
              display: 'grid',
              flexShrink: 0,
              gridTemplateColumns: 'minmax(0, max-content)',
              justifyContent: 'end',
              width: EPIC_SLOT_WIDTH,
            }}
          >
            {epicName !== null && (
              <TaskChip
                title={`${t('Epic')}: ${epicName}`}
                icon={
                  <TaskColorDot
                    color={readTagColor(epicColor ?? 'purple').text}
                  />
                }
              >
                {epicName}
              </TaskChip>
            )}
          </span>
        )}
      </button>
      {!isCompact && (
        <>
          <span
            title={t('Story points')}
            style={{
              color: TASK_TOKENS.textTertiary,
              flexShrink: 0,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
              width: 28,
            }}
          >
            {typeof issue.storyPoints === 'number' ? issue.storyPoints : ''}
          </span>
          <span
            title={isOverdue ? t('Overdue') : t('Due date')}
            style={{
              alignItems: 'center',
              color: isOverdue
                ? TASK_TOKENS.textDanger
                : TASK_TOKENS.textTertiary,
              display: 'inline-flex',
              flexShrink: 0,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: isOverdue ? 500 : 400,
              gap: 4,
              justifyContent: 'flex-end',
              width: 64,
            }}
          >
            {dueLabel !== null && (
              <>
                <IconCalendarEvent size={12} />
                {dueLabel}
              </>
            )}
          </span>
        </>
      )}
      {editing === null ? (
        <span
          title={assigneeName ?? t('Unassigned')}
          style={{
            display: 'inline-flex',
            width: 24,
            justifyContent: 'center',
          }}
        >
          {assigneeAvatar}
        </span>
      ) : (
        <TaskPropertyMenu
          label={t('Change assignee')}
          trigger={assigneeAvatar}
          options={editing.assigneeOptions}
          selectedValue={issue.assigneeId ?? UNASSIGNED_OPTION_VALUE}
          onSelect={editing.onChangeAssignee}
          offsetX={-196}
        />
      )}
    </div>
  );
};
