import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconChevronDown, IconChevronRight } from 'twenty-ui/icon';

import { type PageInset } from '../../types/task-board';
import { formatSprintCapacity } from '../utils/format-sprint-capacity.util';
import { readTagColor, TASK_TOKENS } from './task-tokens';

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
  // The sprint's planned points; absent or unset keeps the header as it was.
  capacity?: number | null;
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
  inset: PageInset;
  // Done / in progress, drawn as a bar for a sprint; absent for the backlog.
  progress: ReactNode;
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
  capacity,
  isCollapsed,
  onToggleCollapsed,
  action,
  menu,
  isDragActive,
  isEndDropTarget,
  onDragOverEnd,
  onDropEnd,
  isEmpty,
  inset,
  progress,
  children,
  footer,
}: TaskBacklogSectionProps) => {
  const ChevronIcon = isCollapsed ? IconChevronRight : IconChevronDown;
  const capacitySummary = formatSprintCapacity({ storyPointTotal, capacity });
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
        boxShadow: isEndDropTarget
          ? `inset 0 0 0 1px ${TASK_TOKENS.accent}`
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <header
        onDragOver={handleDragOverEnd}
        onDrop={handleDropEnd}
        style={{
          alignItems: 'center',
          background: TASK_TOKENS.backgroundSecondary,
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          borderTop: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 10,
          marginTop: -1,
          minHeight: 40,
          padding: `0 ${inset.right}px 0 ${Math.max(inset.left - 8, 2)}px`,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <button
          type="button"
          aria-expanded={!isCollapsed}
          onClick={onToggleCollapsed}
          style={{
            alignItems: 'center',
            alignSelf: 'stretch',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flex: 1,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            gap: 8,
            minWidth: 0,
            padding: '0 4px',
            textAlign: 'left',
          }}
        >
          <ChevronIcon size={14} color={TASK_TOKENS.textTertiary} />
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
            {title}
          </span>
          {isActive && (
            <span
              style={{
                background: readTagColor('green').background,
                borderRadius: TASK_TOKENS.radiusExtraSmall,
                color: readTagColor('green').text,
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 600,
                padding: '1px 6px',
              }}
            >
              {t('Active')}
            </span>
          )}
          {!isCompact && dateRange !== null && (
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {dateRange}
            </span>
          )}
          {!isCompact && description !== undefined && (
            <span
              style={{ color: TASK_TOKENS.textTertiary, whiteSpace: 'nowrap' }}
            >
              {description}
            </span>
          )}
          {!isCompact && (
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {storyPointTotal > 0
                ? `· ${issueCountLabel} · ${t('{count} pts', { count: storyPointTotal })}`
                : `· ${issueCountLabel}`}
            </span>
          )}
        </button>
        {!isCompact && progress}
        {!isCompact && capacitySummary !== null && (
          <span
            title={
              capacitySummary.isOverCapacity
                ? t('Planned points exceed the sprint capacity')
                : t('Planned points / sprint capacity')
            }
            style={{
              color: capacitySummary.isOverCapacity
                ? readTagColor('orange').text
                : TASK_TOKENS.textTertiary,
              flexShrink: 0,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: capacitySummary.isOverCapacity ? 500 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {t('{points} / {capacity} pts', {
              points: capacitySummary.storyPointTotal,
              capacity: capacitySummary.capacity,
            })}
          </span>
        )}
        {action}
        {menu}
      </header>
      {!isCollapsed && (
        <div
          style={{
            background: TASK_TOKENS.background,
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
                color: isEndDropTarget
                  ? TASK_TOKENS.accent
                  : TASK_TOKENS.textTertiary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                margin: `8px ${inset.right}px 8px ${inset.left}px`,
                padding: isEmpty ? '14px 8px' : '6px 8px',
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
