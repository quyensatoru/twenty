import { type ReactNode, useState } from 'react';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioTagButtonProps = {
  children: ReactNode;
  onClick: () => void;
  tone?: 'accent' | 'neutral';
  isDashed?: boolean;
  title?: string;
};

// A clickable Twenty-style tag (twenty-ui Tag look). Tag itself is only used
// for static badges: its button mode crashes the sandbox on click.
export const StudioTagButton = ({
  children,
  onClick,
  tone = 'neutral',
  isDashed = false,
  title,
}: StudioTagButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isAccent = tone === 'accent';

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isDashed
          ? isHovered
            ? STUDIO_TOKENS.backgroundHover
            : 'transparent'
          : isAccent
            ? STUDIO_TOKENS.accentSoft
            : STUDIO_TOKENS.backgroundTertiary,
        border: isDashed
          ? `1px dashed ${STUDIO_TOKENS.borderStrong}`
          : '1px solid transparent',
        borderRadius: STUDIO_TOKENS.radiusSmall,
        color: isAccent ? STUDIO_TOKENS.accent : STUDIO_TOKENS.textSecondary,
        cursor: 'pointer',
        display: 'inline-flex',
        fontFamily: STUDIO_TOKENS.fontFamily,
        fontSize: 12,
        fontWeight: 500,
        gap: 4,
        height: 20,
        opacity: isHovered && !isDashed ? 0.8 : 1,
        padding: '0 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};
