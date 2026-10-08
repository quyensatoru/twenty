import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconChevronDown, IconChevronRight } from 'twenty-ui/icon';

import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

type TaskBacklogSectionProps = {
  title: string;
  // What the section holds, for the one whose name alone is ambiguous: the
  // backlog section shares its name with a status.
  description?: string;
  dateRange: string | null;
  isActive: boolean;
  // Phone width: the dates, description and count give way to the title.
  isCompact: boolean;
  issueCountLabel: string;
  storyPointTotal: number;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  // Start / Complete sprint, and the "..." menu. Siblings of the collapse
  // button, never inside it: the sandbox does not forward stopPropagation, so
  // a nested control would also toggle the section.
  action: ReactNode;
  menu: ReactNode;
  isDragActive: boolean;
  // A drop on the header or the end zone appends the row to this section.
  isEndDropTarget: boolean;
  onDragOverEnd: () => void;
  onDropEnd: () => void;
  isEmpty: boolean;
  children: ReactNode;
  footer: ReactNode;
};

// One sprint (or the backlog) in Jira's backlog: a collapsible header with
// its dates, issue count and points, the rows, and an inline create.
export const TaskBacklogSection = ({
  title,
  description,
  dateRange,
  isActive,
  isCompact,
  issueCountLabel,
  storyPointTotal,
  isCollapsed,
  onToggleCollapsed,
  action,
  menu,
  isDragActive,
  isEndDropTarget,
  onDragOverEnd,
  onDropEnd,
  isEmpty,
  children,
  footer,
}: TaskBacklogSectionProps) => {
  const ChevronIcon = isCollapsed ? IconChevronRight : IconChevronDown;
  const handleDragOverEnd = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onDragOverEnd();
  };
  const handleDropEnd = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onDropEnd();
  };

  return (
    <section
      style={{
        background: TASK_TOKENS.backgroundSecondary,
        border: `1px solid ${isEndDropTarget ? TASK_TOKENS.accent : TASK_TOKENS.borderLight}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <header
        onDragOver={handleDragOverEnd}
        onDrop={handleDropEnd}
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          minHeight: 44,
          padding: '0 8px 0 4px',
        }}
      >
        <button
          type="button"
          aria-expanded={!isCollapsed}
          onClick={onToggleCollapsed}
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
            padding: '8px 4px',
            textAlign: 'left',
          }}
        >
          <ChevronIcon size={16} color={TASK_TOKENS.textTertiary} />
          <span
            style={{
              color: TASK_TOKENS.textPrimary,
              fontSize: 14,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {!isCompact && description !== undefined && (
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {`· ${description}`}
            </span>
          )}
          {isActive && <TaskTag color="purple">{t('Active')}</TaskTag>}
          {!isCompact && dateRange !== null && (
            <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
              {dateRange}
            </span>
          )}
          {!isCompact && (
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {`(${issueCountLabel})`}
            </span>
          )}
        </button>
        <span
          title={t('Story points')}
          style={{
            background: TASK_TOKENS.backgroundTertiary,
            borderRadius: 10,
            color: TASK_TOKENS.textSecondary,
            flexShrink: 0,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 11,
            lineHeight: '18px',
            padding: '0 8px',
          }}
        >
          {storyPointTotal}
        </span>
        {action}
        {menu}
      </header>
      {!isCollapsed && (
        <div
          style={{
            background: TASK_TOKENS.background,
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
          {(isEmpty || isDragActive) && (
            <div
              onDragOver={handleDragOverEnd}
              onDrop={handleDropEnd}
              style={{
                border: `1px dashed ${isEndDropTarget ? TASK_TOKENS.accent : TASK_TOKENS.borderStrong}`,
                borderRadius: TASK_TOKENS.radiusSmall,
                color: isEndDropTarget ? TASK_TOKENS.accent : TASK_TOKENS.textTertiary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                margin: 8,
                padding: isEmpty ? '16px 8px' : '6px 8px',
                textAlign: 'center',
              }}
            >
              {isEmpty && !isDragActive
                ? t('Plan a sprint by dragging issues here.')
                : t('Drop here')}
            </div>
          )}
          {footer}
        </div>
      )}
    </section>
  );
};
