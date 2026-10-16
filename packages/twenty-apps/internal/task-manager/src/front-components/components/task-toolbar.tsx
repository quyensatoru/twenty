import { type ReactNode, useState } from 'react';

import { stringToThemeColorName } from '../../utils/string-to-theme-color.util';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type TaskProjectBadgeProps = {
  projectKey: string | null;
  size?: number;
};

// The project's key on a tinted square, coloured from the key itself so a
// project keeps the same badge everywhere it shows.
export const TaskProjectBadge = ({
  projectKey,
  size = 22,
}: TaskProjectBadgeProps) => {
  const label = (projectKey ?? '?').slice(0, 3).toUpperCase();
  const tone = readTagColor(stringToThemeColorName(label));

  return (
    <span
      aria-hidden
      style={{
        alignItems: 'center',
        background: tone.background,
        borderRadius: 5,
        color: tone.text,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: label.length > 2 ? size * 0.36 : size * 0.45,
        fontWeight: 700,
        height: size,
        justifyContent: 'center',
        letterSpacing: -0.2,
        width: size,
      }}
    >
      {label}
    </span>
  );
};

type TaskToolbarToggleProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};

// A 28px icon button that stays tinted while what it opens is open.
export const TaskToolbarToggle = ({
  label,
  isActive,
  onClick,
  children,
}: TaskToolbarToggleProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isActive
          ? TASK_TOKENS.backgroundSelected
          : isHovered
            ? TASK_TOKENS.backgroundHover
            : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: isActive ? TASK_TOKENS.textPrimary : TASK_TOKENS.textSecondary,
        cursor: 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: 28,
        justifyContent: 'center',
        padding: 0,
        width: 28,
      }}
    >
      {children}
    </button>
  );
};
