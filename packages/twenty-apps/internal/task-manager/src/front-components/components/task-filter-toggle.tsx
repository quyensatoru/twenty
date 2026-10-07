import { useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskFilterToggleProps = {
  label: string;
  isActive: boolean;
  onToggle: () => void;
};

// A Jira quick filter: a pressable chip that reads as "on" in the accent
// colour, so the active filters are visible without opening anything.
export const TaskFilterToggle = ({
  label,
  isActive,
  onToggle,
}: TaskFilterToggleProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isActive
          ? TASK_TOKENS.accentSoft
          : isHovered
            ? TASK_TOKENS.backgroundHover
            : TASK_TOKENS.background,
        border: `1px solid ${isActive ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: isActive ? TASK_TOKENS.accent : TASK_TOKENS.textSecondary,
        cursor: 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 500,
        height: 32,
        padding: '0 12px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
};
