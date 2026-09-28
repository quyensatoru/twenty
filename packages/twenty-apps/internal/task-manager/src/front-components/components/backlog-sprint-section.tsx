import { type DragEvent, type ReactNode, useState } from 'react';

import { SPRINT_STATE_OPTIONS } from '../../constants/sprint-state-options';
import { type IssueRow, type SprintRow } from '../../types/task-manager-rows';
import { readSelectOption } from '../../utils/read-select-option.util';
import { BacklogIssueRow } from './backlog-issue-row';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type BacklogSprintSectionProps = {
  sprint?: SprintRow;
  title: string;
  issues: IssueRow[];
  draggingIssueId: string | null;
  onDragStartIssue: (issueId: string) => void;
  onDragEndIssue: () => void;
  onDropIssue: (targetIndex: number) => void;
  onOpenIssue: (issueId: string) => void;
  actions?: ReactNode;
};

export const BacklogSprintSection = ({
  sprint,
  title,
  issues,
  draggingIssueId,
  onDragStartIssue,
  onDragEndIssue,
  onDropIssue,
  onOpenIssue,
  actions,
}: BacklogSprintSectionProps) => {
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);
  const state = readSelectOption(SPRINT_STATE_OPTIONS, sprint?.state);

  const renderGap = (index: number) => (
    <div
      key={`gap-${index}`}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        // Without preventDefault the browser refuses the drop outright.
        event.preventDefault();
        setActiveGapIndex(index);
      }}
      onDragLeave={() => setActiveGapIndex(null)}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setActiveGapIndex(null);
        onDropIssue(index);
      }}
      style={{
        background:
          activeGapIndex === index ? TASK_TOKENS.accent : 'transparent',
        borderRadius: 2,
        height: activeGapIndex === index ? 3 : 8,
      }}
    />
  );

  return (
    <section style={{ marginBottom: 24 }}>
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          padding: '6px 2px',
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        {state !== undefined && (
          <TaskTag color={state.color}>{state.label}</TaskTag>
        )}
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            flex: 1,
          }}
        >
          {issues.length}
        </span>
        {actions}
      </header>
      <div
        onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
        style={{
          border: `1px solid ${TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 44,
          overflow: 'hidden',
        }}
      >
        {renderGap(0)}
        {issues.map((issue, index) => (
          <div key={issue.id} style={{ display: 'contents' }}>
            <BacklogIssueRow
              issue={issue}
              isDragging={draggingIssueId === issue.id}
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
