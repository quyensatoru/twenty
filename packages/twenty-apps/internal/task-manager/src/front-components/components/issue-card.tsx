import { type DragEvent, useState } from 'react';

import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { type IssueRow } from '../../types/task-manager-rows';
import { readSelectOption } from '../../utils/read-select-option.util';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type IssueCardProps = {
  issue: IssueRow;
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onOpen: (issueId: string) => void;
};

// Native HTML5 drag and drop, not a JS drag library: the sandbox forwards
// dragstart/dragover/drop and the browser does the hit-testing itself, whereas
// pointer-based libraries reach for document.elementFromPoint, which does not
// exist here.
export const IssueCard = ({
  issue,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: IssueCardProps) => {
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
        background: isHovered
          ? TASK_TOKENS.backgroundHover
          : TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxShadow: isDragging ? TASK_TOKENS.shadowStrong : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 6,
        opacity: isDragging ? 0.4 : 1,
        padding: 8,
      }}
    >
      <span
        style={{
          color: TASK_TOKENS.textPrimary,
          fontSize: 13,
          lineHeight: '18px',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {issue.title ?? ''}
      </span>
      <div
        style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 4 }}
      >
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 11 }}>
          {issue.issueKey ?? ''}
        </span>
        {priority !== undefined && (
          <TaskTag color={priority.color}>{priority.label}</TaskTag>
        )}
        {typeof issue.storyPoints === 'number' && (
          <TaskTag color="gray">{`${issue.storyPoints} pts`}</TaskTag>
        )}
      </div>
    </div>
  );
};
