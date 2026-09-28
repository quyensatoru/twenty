import { type ReactNode, useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  isDisabled?: boolean;
  title?: string;
};

const VARIANT_STYLES = {
  primary: {
    background: TASK_TOKENS.accent,
    hoverBackground: TASK_TOKENS.accentHover,
    border: TASK_TOKENS.accent,
    color: '#ffffff',
  },
  secondary: {
    background: TASK_TOKENS.background,
    hoverBackground: TASK_TOKENS.backgroundHover,
    border: TASK_TOKENS.border,
    color: TASK_TOKENS.textSecondary,
  },
  ghost: {
    background: 'transparent',
    hoverBackground: TASK_TOKENS.backgroundHover,
    border: 'transparent',
    color: TASK_TOKENS.textSecondary,
  },
} as const;

// Styled after twenty-ui's Button but built from plain elements: twenty-ui's
// own is base-ui backed and constructs PointerEvents the sandbox lacks. Hover
// is state-driven because an app cannot ship a stylesheet, so there is no
// `:hover` to declare.
export const TaskButton = ({
  children,
  onClick,
  variant = 'secondary',
  isDisabled = false,
  title,
}: TaskButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const style = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      title={title}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background:
          isHovered && !isDisabled ? style.hoverBackground : style.background,
        border: `1px solid ${style.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: style.color,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 500,
        gap: 4,
        height: 24,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: '0 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};
