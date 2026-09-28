import { type ReactNode, useState } from 'react';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioIconButtonProps = {
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
  isDanger?: boolean;
  children: ReactNode;
};

// Styled after twenty-ui's LightIconButton.
export const StudioIconButton = ({
  label,
  onClick,
  isDisabled = false,
  isDanger = false,
  children,
}: StudioIconButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background:
          isHovered && !isDisabled
            ? STUDIO_TOKENS.backgroundHover
            : 'transparent',
        border: 'none',
        borderRadius: STUDIO_TOKENS.radiusSmall,
        color: isDanger ? STUDIO_TOKENS.red : STUDIO_TOKENS.textTertiary,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: 24,
        justifyContent: 'center',
        opacity: isDisabled ? 0.35 : 1,
        padding: 0,
        width: 24,
      }}
    >
      {children}
    </button>
  );
};
