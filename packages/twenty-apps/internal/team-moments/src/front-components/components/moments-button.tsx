import { type ReactNode, useState } from 'react';

import { MOMENTS_TOKENS } from './moments-tokens';

type MomentsButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark' | 'hero';
  isDisabled?: boolean;
  ariaLabel?: string;
  startIcon?: ReactNode;
  size?: 'small' | 'medium';
};

const VARIANT_STYLES = {
  primary: { background: MOMENTS_TOKENS.accent, hover: MOMENTS_TOKENS.accentHover, border: MOMENTS_TOKENS.accent, color: '#ffffff' },
  secondary: { background: MOMENTS_TOKENS.background, hover: MOMENTS_TOKENS.backgroundHover, border: MOMENTS_TOKENS.border, color: MOMENTS_TOKENS.textPrimary },
  ghost: { background: 'transparent', hover: MOMENTS_TOKENS.backgroundHover, border: 'transparent', color: MOMENTS_TOKENS.textSecondary },
  dark: { background: MOMENTS_TOKENS.inverted, hover: MOMENTS_TOKENS.inverted, border: MOMENTS_TOKENS.inverted, color: MOMENTS_TOKENS.invertedText },
  hero: { background: '#FFF5F8', hover: '#F9D3E2', border: '#FFF5F8', color: '#6E1A42' },
} as const;

// :hover is driven from state because a front component cannot ship a
// stylesheet.
export const MomentsButton = ({
  children,
  onClick,
  variant = 'secondary',
  isDisabled = false,
  ariaLabel,
  startIcon,
  size = 'medium',
}: MomentsButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const style = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered && !isDisabled ? style.hover : style.background,
        border: `1px solid ${style.border}`,
        borderRadius: MOMENTS_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: style.color,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: MOMENTS_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: variant === 'primary' || variant === 'dark' ? 500 : 400,
        gap: 6,
        height: size === 'small' ? 26 : 32,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: size === 'small' ? '0 8px' : '0 12px',
        whiteSpace: 'nowrap',
      }}
    >
      {startIcon}
      {children}
    </button>
  );
};
