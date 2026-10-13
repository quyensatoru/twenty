import { type ReactNode, useState } from 'react';

import { INBOX_TOKENS } from './inbox-tokens';

type InboxButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  href?: string;
  isDisabled?: boolean;
};

// One look for buttons and external links, so "Open in Crisp" (a link) and
// "Sync now" (an action) sit side by side without drifting apart.
export const InboxButton = ({
  children,
  icon,
  variant = 'secondary',
  onClick,
  href,
  isDisabled = false,
}: InboxButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPrimary = variant === 'primary';
  const style = {
    alignItems: 'center',
    background: isPrimary
      ? INBOX_TOKENS.accent
      : isHovered && !isDisabled
        ? INBOX_TOKENS.backgroundHover
        : INBOX_TOKENS.background,
    border: isPrimary ? 'none' : `1px solid ${INBOX_TOKENS.border}`,
    borderRadius: 10,
    boxShadow: isPrimary
      ? `0 1px 2px rgba(16,24,40,.12), inset 0 1px 0 rgba(255,255,255,.12)`
      : 'none',
    color: isPrimary ? INBOX_TOKENS.textInverted : INBOX_TOKENS.textPrimary,
    cursor: isDisabled ? 'default' : 'pointer',
    display: 'inline-flex',
    filter: isPrimary && isHovered && !isDisabled ? 'brightness(1.08)' : 'none',
    flexShrink: 0,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    gap: 6,
    height: 32,
    opacity: isDisabled ? 0.6 : 1,
    padding: '0 12px',
    textDecoration: 'none',
    transition: 'background 120ms ease, filter 120ms ease',
    whiteSpace: 'nowrap',
  } as const;

  if (href !== undefined) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={style}
      >
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
    >
      {icon}
      {children}
    </button>
  );
};
