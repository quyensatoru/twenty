import { useState } from 'react';

import { type LinkedIssueRow } from '../hooks/use-issue-detail';
import { TaskAvatar } from './task-avatar';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type TaskSubtaskRowProps = {
  row: LinkedIssueRow;
  statusName: string | null;
  statusColor?: string | null;
  ownerName: string | null;
  ownerAvatarUrl?: string | null;
  onOpen: () => void;
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
}: TaskSubtaskRowProps) => {
  // State-driven, because an app ships no stylesheet and there is no `:hover`
  // to declare.
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      title={row.title ?? row.issueKey ?? row.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered
          ? TASK_TOKENS.backgroundTransparentLighter
          : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radius,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        minHeight: 36,
        padding: '4px 8px',
        textAlign: 'left',
        width: '100%',
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
  );
};
