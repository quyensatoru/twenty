import { type ReactNode, useState } from 'react';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isDisabled?: boolean;
  title?: string;
  startIcon?: ReactNode;
  isFullWidth?: boolean;
};

const VARIANT_STYLES = {
  primary: {
    background: STUDIO_TOKENS.accent,
    hoverBackground: STUDIO_TOKENS.accentHover,
    border: STUDIO_TOKENS.accent,
    color: '#ffffff',
  },
  secondary: {
    background: STUDIO_TOKENS.background,
    hoverBackground: STUDIO_TOKENS.backgroundHover,
    border: STUDIO_TOKENS.border,
    color: STUDIO_TOKENS.textSecondary,
  },
  danger: {
    background: STUDIO_TOKENS.background,
    hoverBackground: STUDIO_TOKENS.redSoft,
    border: STUDIO_TOKENS.border,
    color: STUDIO_TOKENS.red,
  },
  ghost: {
    background: 'transparent',
    hoverBackground: STUDIO_TOKENS.backgroundHover,
    border: 'transparent',
    color: STUDIO_TOKENS.textSecondary,
  },
} as const;

// Styled after twenty-ui's Button (outline / solid / ghost, 24px, medium
// weight), with plain events the sandbox can proxy.
export const StudioButton = ({
  children,
  onClick,
  variant = 'secondary',
  isDisabled = false,
  title,
  startIcon,
  isFullWidth = false,
}: StudioButtonProps) => {
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
        borderRadius: STUDIO_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: style.color,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: STUDIO_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 500,
        gap: 4,
        height: 24,
        justifyContent: isFullWidth ? 'flex-start' : 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: '0 8px',
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
