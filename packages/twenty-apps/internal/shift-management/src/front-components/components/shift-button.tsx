import { type ReactNode, useState } from 'react';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isDisabled?: boolean;
  title?: string;
  ariaLabel?: string;
  startIcon?: ReactNode;
  isFullWidth?: boolean;
};

const VARIANT_STYLES = {
  primary: {
    background: SHIFT_TOKENS.accent,
    hoverBackground: SHIFT_TOKENS.accentHover,
    border: SHIFT_TOKENS.accent,
    color: '#ffffff',
  },
  secondary: {
    background: SHIFT_TOKENS.background,
    hoverBackground: SHIFT_TOKENS.backgroundHover,
    border: SHIFT_TOKENS.border,
    color: SHIFT_TOKENS.textSecondary,
  },
  danger: {
    background: SHIFT_TOKENS.red,
    hoverBackground: SHIFT_TOKENS.redText,
    border: SHIFT_TOKENS.red,
    color: '#ffffff',
  },
  ghost: {
    background: 'transparent',
    hoverBackground: SHIFT_TOKENS.backgroundHover,
    border: 'transparent',
    color: SHIFT_TOKENS.textSecondary,
  },
} as const;

// Styled after twenty-ui's Button with plain events the sandbox can proxy;
// :hover is driven from state because a front component cannot ship a
// stylesheet.
export const ShiftButton = ({
  children,
  onClick,
  variant = 'secondary',
  isDisabled = false,
  title,
  ariaLabel,
  startIcon,
  isFullWidth = false,
}: ShiftButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const style = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background:
          isHovered && !isDisabled ? style.hoverBackground : style.background,
        border: `1px solid ${style.border}`,
        borderRadius: SHIFT_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: style.color,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: SHIFT_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 500,
        gap: 4,
        height: 28,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: '0 10px',
        transition: 'background 0.1s ease',
        whiteSpace: 'nowrap',
        width: isFullWidth ? '100%' : undefined,
      }}
    >
      {startIcon}
      {children}
    </button>
  );
};
