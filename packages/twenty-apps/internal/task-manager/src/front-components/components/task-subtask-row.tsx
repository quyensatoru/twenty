import { useState } from 'react';
import { IconX } from 'twenty-ui/icon';

import { type LinkedIssueRow } from '../hooks/use-issue-detail';
import { TaskAvatar } from './task-avatar';
import { TaskIconButton } from './task-icon-button';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type TaskSubtaskRowProps = {
  row: LinkedIssueRow;
  statusName: string | null;
  statusColor?: string | null;
  ownerName: string | null;
  ownerAvatarUrl?: string | null;
  onOpen: () => void;
  // Detaches the link (clears the parent pointer) without deleting anything.
  // A sibling of the open button, never nested inside it: nested buttons read
  // as one serialized click in the sandbox and always open the row instead.
  onUnlink?: () => void;
  unlinkLabel?: string;
};

// One linked issue: state, key, title, owner. A button rather than a link,
// because leaving the record is not what opening a linked issue is for — the
// host's own relation chips open beside it, and so does this.
export const TaskSubtaskRow = ({
  row,
  statusName,
  statusColor,
  ownerName,
  ownerAvatarUrl,
  onOpen,
  onUnlink,
  unlinkLabel,
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
        background: isHovered
          ? TASK_TOKENS.backgroundTransparentLighter
          : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        gap: 4,
        minHeight: 36,
        padding: '4px 4px 4px 8px',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        title={row.title ?? row.issueKey ?? row.id}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flex: 1,
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 8,
          minWidth: 0,
          padding: 0,
          textAlign: 'left',
        }}
      >
        {statusName !== null && (
          <TaskTag color={statusColor}>{statusName}</TaskTag>
        )}
        <span
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: TASK_TOKENS.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.issueKey ?? row.id}
          </span>
          {typeof row.title === 'string' && row.title !== '' && (
            <span
              style={{
                color: TASK_TOKENS.textSecondary,
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.title}
            </span>
          )}
        </span>
        {ownerName !== null && (
          <TaskAvatar name={ownerName} avatarUrl={ownerAvatarUrl} size={20} />
        )}
      </button>
      {onUnlink !== undefined && isHovered && (
        <TaskIconButton label={unlinkLabel ?? 'Unlink'} onClick={onUnlink}>
          <IconX size={14} />
        </TaskIconButton>
      )}
    </div>
  );
};
