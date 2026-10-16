import { type ReactNode, useState } from 'react';

import { INBOX_TOKENS } from './inbox-tokens';

type InboxIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  // The box's side. 32 in the inbox; smaller inside a line of text or a
  // card header, where a 32px box would set the line's height.
  size?: number;
  // A toggle that is on reads in the accent, not just a hover tint.
  isActiveAccent?: boolean;
};

export const InboxIconButton = ({
  label,
  onClick,
  children,
  isActive = false,
  isDisabled = false,
  size = 32,
  isActiveAccent = false,
}: InboxIconButtonProps) => {
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
          isActive && isActiveAccent
            ? INBOX_TOKENS.accentSoft
            : isActive || (isHovered && !isDisabled)
              ? INBOX_TOKENS.backgroundHover
              : 'transparent',
        border: 'none',
        borderRadius: size < 32 ? 4 : 8,
        color:
          isActive && isActiveAccent
            ? INBOX_TOKENS.accent
            : isActive
              ? INBOX_TOKENS.textPrimary
              : INBOX_TOKENS.textSecondary,
        cursor: isDisabled ? 'default' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: 0,
        transition: 'background 120ms ease',
        width: size,
      }}
    >
      {children}
    </button>
  );
};
