import { type ReactNode, useState } from 'react';

import { INBOX_CIRCLE_STYLE, INBOX_TOKENS } from './inbox-tokens';

type QuickActionProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  isDisabled?: boolean;
};

// A round action with its name under it, the row Intercom and Front put
// under a contact: the three things support does next, one click each.
export const QuickAction = ({
  label,
  icon,
  onClick,
  href,
  isDisabled = false,
}: QuickActionProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = isHovered && !isDisabled;
  const content = (
    <>
      <span
        style={{
          ...INBOX_CIRCLE_STYLE,
          alignItems: 'center',
          background: isActive
            ? INBOX_TOKENS.accentSoft
            : INBOX_TOKENS.backgroundTertiary,
          color: isActive ? INBOX_TOKENS.accent : INBOX_TOKENS.textSecondary,
          display: 'flex',
          height: 38,
          justifyContent: 'center',
          transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
          transition:
            'background 160ms ease, color 160ms ease, transform 200ms cubic-bezier(.2,.8,.2,1)',
          width: 38,
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
    </>
  );
  const style = {
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    color: INBOX_TOKENS.textSecondary,
    cursor: isDisabled ? 'default' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'inherit',
    gap: 6,
    opacity: isDisabled ? 0.45 : 1,
    padding: 0,
    textDecoration: 'none',
    width: 64,
  } as const;

  if (href !== undefined && !isDisabled) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
    >
      {content}
    </button>
  );
};
