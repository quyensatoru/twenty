import { type DragEvent, useState } from 'react';

import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { type IssueRow } from '../../types/task-manager-rows';
import { readSelectOption } from '../../utils/read-select-option.util';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type BacklogIssueRowProps = {
  issue: IssueRow;
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onOpen: (issueId: string) => void;
};

export const BacklogIssueRow = ({
  issue,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: BacklogIssueRowProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const priority = readSelectOption(ISSUE_PRIORITY_OPTIONS, issue.priority);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(issue.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered
          ? TASK_TOKENS.backgroundHover
          : TASK_TOKENS.background,
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        boxShadow: isDragging ? TASK_TOKENS.shadowStrong : 'none',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        opacity: isDragging ? 0.4 : 1,
        padding: '6px 8px',
      }}
    >
      <span
        style={{
          color: TASK_TOKENS.textTertiary,
          fontSize: 12,
          flexShrink: 0,
          minWidth: 64,
        }}
      >
        {issue.issueKey ?? ''}
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
        {issue.title ?? ''}
      </span>
      {priority !== undefined && (
        <TaskTag color={priority.color}>{priority.label}</TaskTag>
      )}
      {typeof issue.storyPoints === 'number' && (
        <TaskTag color="gray">{`${issue.storyPoints} pts`}</TaskTag>
      )}
    </div>
  );
};
