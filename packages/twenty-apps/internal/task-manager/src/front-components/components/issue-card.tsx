import { type DragEvent, useState } from 'react';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { type IssueCardFieldName } from '../../constants/issue-card-fields';
import { type IssueRow } from '../../types/task-manager-rows';
import { readSelectOption } from '../../utils/read-select-option.util';
import { type MemberRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type IssueCardProps = {
  issue: IssueRow;
  isDragging: boolean;
  visibleFields: IssueCardFieldName[];
  membersById: Map<string, MemberRow>;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onOpen: (issueId: string) => void;
};

const formatDueDate = (dueDate: string | null | undefined): string | null =>
  typeof dueDate === 'string' ? new Date(dueDate).toLocaleDateString() : null;

// Native HTML5 drag and drop, not a JS drag library: the sandbox forwards
// dragstart/dragover/drop and the browser does the hit-testing itself, whereas
// pointer-based libraries reach for document.elementFromPoint, which does not
// exist here.
export const IssueCard = ({
  issue,
  isDragging,
  visibleFields,
  membersById,
  onDragStart,
  onDragEnd,
  onOpen,
}: IssueCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const priority = readSelectOption(ISSUE_PRIORITY_OPTIONS, issue.priority);
  const dueDate = formatDueDate(issue.dueDate);
  const assigneeName =
    typeof issue.assigneeId === 'string'
      ? readMemberName(membersById, issue.assigneeId, '')
      : '';
  const labels = Array.isArray(issue.labels) ? issue.labels : [];

  const chips = [
    visibleFields.includes('priority') && priority !== undefined ? (
      <TaskTag key="priority" color={priority.color}>
        {priority.label}
      </TaskTag>
    ) : null,
    visibleFields.includes('storyPoints') &&
    typeof issue.storyPoints === 'number' ? (
      <TaskTag key="storyPoints" color="gray">{`${issue.storyPoints} pts`}</TaskTag>
    ) : null,
    ...(visibleFields.includes('labels')
      ? labels.map((label) => {
          const option = readSelectOption(ISSUE_LABEL_OPTIONS, label);

          return (
            <TaskTag key={`label-${label}`} color={option?.color ?? 'gray'}>
              {option?.label ?? label}
            </TaskTag>
          );
        })
      : []),
    visibleFields.includes('dueDate') && dueDate !== null ? (
      <TaskTag key="dueDate" color="orange">
        {dueDate}
      </TaskTag>
    ) : null,
    visibleFields.includes('assignee') && assigneeName !== '' ? (
      <TaskTag key="assignee" color="turquoise">
        {assigneeName}
      </TaskTag>
    ) : null,
  ].filter((chip) => chip !== null);

  const showsKey = visibleFields.includes('issueKey');

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
      {!showsKey && chips.length === 0 ? null : (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {showsKey ? (
            <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 11 }}>
              {issue.issueKey ?? ''}
            </span>
          ) : null}
          {chips}
        </div>
      )}
    </div>
  );
};
