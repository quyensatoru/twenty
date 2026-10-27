import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconChartBar, IconLayoutKanban } from 'twenty-ui/icon';

import { type BoardViewMode } from '../../types/task-board';
import { TASK_TOKENS } from './task-tokens';

type TaskViewSwitchProps = {
  value: BoardViewMode;
  onChange: (value: BoardViewMode) => void;
  // Icons only, so the project picker beside it keeps room on a phone.
  isCompact?: boolean;
};

// The Board's two views of one project: the Kanban, and Insights on how the
// sprint is going. Planning lives in the Product Backlog page.
export const TaskViewSwitch = ({
  value,
  onChange,
  isCompact = false,
}: TaskViewSwitchProps) => {
  const [hoveredValue, setHoveredValue] = useState<BoardViewMode | null>(null);
  const options = [
    { value: 'board' as const, label: t('Kanban'), Icon: IconLayoutKanban },
    { value: 'insights' as const, label: t('Insights'), Icon: IconChartBar },
  ];

  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        gap: 2,
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-label={option.label}
            title={isCompact ? option.label : undefined}
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            onMouseEnter={() => setHoveredValue(option.value)}
            onMouseLeave={() => setHoveredValue(null)}
            style={{
              alignItems: 'center',
              background: isSelected
                ? TASK_TOKENS.backgroundSelected
                : hoveredValue === option.value
                  ? TASK_TOKENS.backgroundHover
                  : 'transparent',
              border: 'none',
              borderRadius: TASK_TOKENS.radiusSmall,
              color: isSelected
                ? TASK_TOKENS.textPrimary
                : TASK_TOKENS.textTertiary,
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              fontWeight: 500,
              gap: 6,
              height: 28,
              padding: isCompact ? '0 8px' : '0 10px',
            }}
          >
            <option.Icon size={14} />
            {!isCompact && option.label}
          </button>
        );
      })}
    </div>
  );
};
