import { type ReactNode } from 'react';

import { useTodaySurface } from '../hooks/use-today-surface';
import { TASK_TOKENS } from './task-tokens';

type TaskTodayActionProps = {
  children: ReactNode;
  onClick: () => void;
  isMotionEnabled: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
};

export const TaskTodayAction = ({
  children,
  onClick,
  isMotionEnabled,
  isSelected,
  isDisabled = false,
}: TaskTodayActionProps) => {
  const surface = useTodaySurface(isMotionEnabled, 8);
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-pressed={isSelected}
      onClick={onClick}
      {...surface.handlers}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 38,
        padding: '0 14px',
        borderRadius: 11,
        border: `1px solid ${isSelected ? TASK_TOKENS.textPrimary : TASK_TOKENS.borderStrong}`,
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 500,
        cursor: isDisabled ? 'default' : 'pointer',
        color: isSelected ? TASK_TOKENS.textPrimary : TASK_TOKENS.textSecondary,
        background: `${surface.glow}, ${TASK_TOKENS.background}`,
        transform: surface.transform,
        transition: surface.transition,
        boxShadow: surface.isActive
          ? '0 7px 22px rgba(24,24,27,.12)'
          : '0 2px 8px rgba(24,24,27,.03)',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
};
