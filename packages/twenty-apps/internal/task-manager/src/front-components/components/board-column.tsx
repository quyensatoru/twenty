import { type DragEvent, useState } from 'react';

import { type IssueCardFieldName } from '../../constants/issue-card-fields';
import { type IssueRow, type IssueStatusRow } from '../../types/task-manager-rows';
import { type MemberRow } from '../hooks/use-issue-detail';
import { IssueCard } from './issue-card';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type BoardColumnProps = {
  issueStatus: IssueStatusRow | null;
  title: string;
  issues: IssueRow[];
  visibleFields: IssueCardFieldName[];
  membersById: Map<string, MemberRow>;
  draggingIssueId: string | null;
  onDragStartIssue: (issueId: string) => void;
  onDragEndIssue: () => void;
  onDropIssue: (targetIndex: number) => void;
  onOpenIssue: (issueId: string) => void;
};

// A column is one drop zone plus one gap per insertion point. Reading the
// cursor position off the drop event is possible here — clientY IS forwarded —
// but per-gap zones let the browser do the hit-testing, which is both cheaper
// and the only thing that keeps working when the column scrolls.
export const BoardColumn = ({
  issueStatus,
  title,
  issues,
  visibleFields,
  membersById,
  draggingIssueId,
  onDragStartIssue,
  onDragEndIssue,
  onDropIssue,
  onOpenIssue,
}: BoardColumnProps) => {
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);

  const handleGapDragOver = (
    event: DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    // Without preventDefault the browser refuses the drop outright.
    event.preventDefault();
    setActiveGapIndex(index);
  };

  const handleGapDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    setActiveGapIndex(null);
    onDropIssue(index);
  };

  const renderGap = (index: number) => (
    <div
      key={`gap-${index}`}
      onDragOver={(event) => handleGapDragOver(event, index)}
      onDragLeave={() => setActiveGapIndex(null)}
      onDrop={(event) => handleGapDrop(event, index)}
      style={{
        background:
          activeGapIndex === index ? TASK_TOKENS.accent : 'transparent',
        borderRadius: 2,
        flexShrink: 0,
        height: activeGapIndex === index ? 3 : 8,
        margin: activeGapIndex === index ? '2px 0' : 0,
      }}
    />
  );

  return (
    <section
      style={{
        background: TASK_TOKENS.backgroundSecondary,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        maxHeight: '100%',
        width: 280,
      }}
    >
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 6,
          padding: '8px 10px',
        }}
      >
        <TaskTag color={issueStatus?.color}>{title}</TaskTag>
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 11,
          }}
        >
          {issues.length}
        </span>
      </header>
      <div
        onDragOver={(event) => event.preventDefault()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 60,
          overflowY: 'auto',
          padding: '0 8px 8px',
        }}
      >
        {renderGap(0)}
        {issues.map((issue, index) => (
          <div key={issue.id} style={{ display: 'contents' }}>
            <IssueCard
              issue={issue}
              isDragging={draggingIssueId === issue.id}
              visibleFields={visibleFields}
              membersById={membersById}
              onDragStart={(event) => {
                // Some browsers refuse to start a drag with no payload set.
                event.dataTransfer.setData('text/plain', issue.id);
                event.dataTransfer.effectAllowed = 'move';
                onDragStartIssue(issue.id);
              }}
              onDragEnd={onDragEndIssue}
              onOpen={onOpenIssue}
            />
            {renderGap(index + 1)}
          </div>
        ))}
      </div>
    </section>
  );
};
