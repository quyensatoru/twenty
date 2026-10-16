import { useState } from 'react';
import { IconX } from 'twenty-ui/icon';

import { type LinkedIssueRow } from '../hooks/use-issue-detail';
import { TaskAvatar } from './task-avatar';
import { TaskIconButton } from './task-icon-button';
import { TaskPriorityGlyph } from './task-priority-glyph';
import { TaskStatusIcon, type TaskStatusGlyph } from './task-status-icon';
import { TASK_TOKENS } from './task-tokens';

type TaskSubtaskRowProps = {
  row: LinkedIssueRow;
  statusName: string | null;
  statusColor?: string | null;
  statusGlyph: TaskStatusGlyph;
  isDone: boolean;
  ownerName: string | null;
  ownerAvatarUrl?: string | null;
  onOpen: () => void;
  // Detaches the link (clears the parent pointer) without deleting anything.
  // A sibling of the open button, never nested inside it: nested buttons read
  // as one serialized click in the sandbox and always open the row instead.
  onUnlink?: () => void;
  unlinkLabel?: string;
  // The parent row reads "Sub-issue of" before the key.
  prefix?: string;
  // Off when no row of the list has an owner: an empty slot kept for one
  // left a gap at the end of every row.
  isOwnerSlotShown?: boolean;
};

// One linked issue on a single line: status, key, title, owner.
export const TaskSubtaskRow = ({
  row,
  statusName,
  statusColor,
  statusGlyph,
  isDone,
  ownerName,
  ownerAvatarUrl,
  onOpen,
  onUnlink,
  unlinkLabel,
  prefix,
  isOwnerSlotShown = true,
}: TaskSubtaskRowProps) => {
  // State-driven, because an app ships no stylesheet and there is no `:hover`
  // to declare.
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        boxSizing: 'border-box',
        display: 'flex',
        gap: 4,
        minHeight: 34,
        padding: '0 6px 0 12px',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        title={row.title ?? row.issueKey ?? row.id}
        style={{
          alignItems: 'center',
          alignSelf: 'stretch',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flex: 1,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          gap: 10,
          minWidth: 0,
          padding: 0,
          textAlign: 'left',
        }}
      >
        <TaskStatusIcon
          glyph={statusGlyph}
          color={statusColor}
          title={statusName ?? undefined}
        />
        {prefix !== undefined && (
          <span style={{ color: TASK_TOKENS.textTertiary, flexShrink: 0 }}>
            {prefix}
          </span>
        )}
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            flexShrink: 0,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {row.issueKey ?? ''}
        </span>
        <span
          style={{
            color: isDone ? TASK_TOKENS.textTertiary : TASK_TOKENS.textPrimary,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textDecoration: isDone ? 'line-through' : 'none',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.title ?? ''}
        </span>
        {/* Priority and owner in fixed slots at the end, as in the design,
            so the titles of a list line up whatever each row carries. */}
        <span
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            width: 18,
          }}
        >
          {typeof row.priority === 'string' && (
            <TaskPriorityGlyph priority={row.priority} />
          )}
        </span>
        {(isOwnerSlotShown || ownerName !== null) && (
          <span
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              width: 20,
            }}
          >
            {ownerName !== null && (
              <TaskAvatar
                name={ownerName}
                avatarUrl={ownerAvatarUrl}
                size={20}
              />
            )}
          </span>
        )}
      </button>
      <span
        style={{
          display: 'inline-flex',
          visibility:
            onUnlink !== undefined && isHovered ? 'visible' : 'hidden',
          width: 24,
        }}
      >
        {onUnlink !== undefined && (
          <TaskIconButton label={unlinkLabel ?? 'Unlink'} onClick={onUnlink}>
            <IconX size={14} />
          </TaskIconButton>
        )}
      </span>
    </div>
  );
};
