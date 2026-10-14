import { type ReactNode, useState } from 'react';

import { INBOX_TOKENS } from './inbox-tokens';

type InboxIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
};

export const InboxIconButton = ({
  label,
  onClick,
  children,
  isActive = false,
  isDisabled = false,
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
          isActive || (isHovered && !isDisabled)
            ? INBOX_TOKENS.backgroundHover
            : 'transparent',
        border: 'none',
        borderRadius: 8,
        color: isActive ? INBOX_TOKENS.textPrimary : INBOX_TOKENS.textSecondary,
        cursor: isDisabled ? 'default' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: 32,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: 0,
        transition: 'background 120ms ease',
        width: 32,
      }}
    >
      {children}
    </button>
  );
};
