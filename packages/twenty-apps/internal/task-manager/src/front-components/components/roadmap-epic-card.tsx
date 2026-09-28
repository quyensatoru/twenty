import { useState } from 'react';

import { type IssueRow, type IssueStatusRow } from '../../types/task-manager-rows';
import { computeEpicProgress } from '../../utils/compute-epic-progress.util';
import { TaskProgressBar } from './task-progress-bar';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type RoadmapEpicCardProps = {
  title: string;
  issues: IssueRow[];
  issueStatusById: Map<string, IssueStatusRow>;
  doneStatusIds: string[];
  onOpenIssue: (issueId: string) => void;
};

const formatDueDate = (dueDate: string | null | undefined): string | null =>
  typeof dueDate === 'string' ? new Date(dueDate).toLocaleDateString() : null;

const IssueLine = ({
  issue,
  issueStatus,
  onOpenIssue,
}: {
  issue: IssueRow;
  issueStatus: IssueStatusRow | undefined;
  onOpenIssue: (issueId: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const dueDate = formatDueDate(issue.dueDate);

  return (
    <div
      onClick={() => onOpenIssue(issue.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
        cursor: 'pointer',
        display: 'flex',
        gap: 8,
        padding: '6px 0',
      }}
    >
      <TaskTag color={issueStatus?.color}>{issueStatus?.name ?? '—'}</TaskTag>
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
        {`${issue.issueKey ?? ''} ${issue.title ?? ''}`.trim()}
      </span>
      {dueDate !== null && (
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
          {dueDate}
        </span>
      )}
    </div>
  );
};

export const RoadmapEpicCard = ({
  title,
  issues,
  issueStatusById,
  doneStatusIds,
  onOpenIssue,
}: RoadmapEpicCardProps) => {
  const progress = computeEpicProgress({ issues, doneStatusIds });

  // Undated issues sink to the bottom rather than sorting as epoch zero.
  const sortedIssues = issues.slice().sort((a, b) => {
    if (!a.dueDate) {
      return 1;
    }

    if (!b.dueDate) {
      return -1;
    }

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <article
      style={{
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        fontFamily: TASK_TOKENS.fontFamily,
        marginBottom: 16,
        padding: 12,
      }}
    >
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
          {`${progress.doneCount}/${progress.totalCount}`}
        </span>
      </header>
      <TaskProgressBar percentage={progress.percentage} />
      {sortedIssues.map((issue) => (
        <IssueLine
          key={issue.id}
          issue={issue}
          issueStatus={
            typeof issue.statusId === 'string'
              ? issueStatusById.get(issue.statusId)
              : undefined
          }
          onOpenIssue={onOpenIssue}
        />
      ))}
    </article>
  );
};
