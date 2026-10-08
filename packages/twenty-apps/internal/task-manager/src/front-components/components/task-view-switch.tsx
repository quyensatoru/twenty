import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconLayoutKanban, IconLayoutList } from 'twenty-ui/icon';

import { type BoardViewMode } from '../../types/task-board';
import { TASK_TOKENS } from './task-tokens';

type TaskViewSwitchProps = {
  value: BoardViewMode;
  onChange: (value: BoardViewMode) => void;
  // Icons only, so the project picker beside it keeps room on a phone.
  isCompact?: boolean;
};

// Jira's Backlog / Board pair: two views of the same project, so the project,
// the filters and the open issue stay put when switching.
export const TaskViewSwitch = ({
  value,
  onChange,
  isCompact = false,
}: TaskViewSwitchProps) => {
  const [hoveredValue, setHoveredValue] = useState<BoardViewMode | null>(null);
  const options = [
    { value: 'backlog' as const, label: t('Backlog'), Icon: IconLayoutList },
    { value: 'board' as const, label: t('Board'), Icon: IconLayoutKanban },
  ];

  return (
    <div
      role="tablist"
      style={{
        background: TASK_TOKENS.backgroundTertiary,
        borderRadius: TASK_TOKENS.radiusSmall,
        display: 'inline-flex',
        flexShrink: 0,
        gap: 2,
        padding: 2,
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
                ? TASK_TOKENS.background
                : hoveredValue === option.value
                  ? TASK_TOKENS.backgroundHover
                  : 'transparent',
              border: 'none',
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: isSelected ? TASK_TOKENS.shadowLight : 'none',
              color: isSelected
                ? TASK_TOKENS.textPrimary
                : TASK_TOKENS.textSecondary,
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              fontWeight: 500,
              gap: 6,
              height: 28,
              padding: '0 10px',
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
