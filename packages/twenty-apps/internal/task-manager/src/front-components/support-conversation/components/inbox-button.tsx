import { type ReactNode, useState } from 'react';

import { INBOX_TOKENS } from './inbox-tokens';

type InboxButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  // After the label: an external-link arrow reads as "this leaves the app".
  trailingIcon?: ReactNode;
  variant?: 'primary' | 'secondary';
  // `small` sits in a 44 to 48px bar inside a side column.
  size?: 'medium' | 'small';
  onClick?: () => void;
  href?: string;
  isDisabled?: boolean;
};

// One look for buttons and external links, so "Open in Crisp" (a link) and
// "Sync now" (an action) sit side by side without drifting apart.
export const InboxButton = ({
  children,
  icon,
  trailingIcon,
  variant = 'secondary',
  size = 'medium',
  onClick,
  href,
  isDisabled = false,
}: InboxButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPrimary = variant === 'primary';
  const isSmall = size === 'small';
  const style = {
    alignItems: 'center',
    background: isPrimary
      ? INBOX_TOKENS.accent
      : isHovered && !isDisabled
        ? INBOX_TOKENS.backgroundHover
        : INBOX_TOKENS.background,
    border: isPrimary ? 'none' : `1px solid ${INBOX_TOKENS.border}`,
    borderRadius: isSmall ? 6 : 10,
    boxShadow: isPrimary
      ? `0 1px 2px rgba(16,24,40,.12), inset 0 1px 0 rgba(255,255,255,.12)`
      : 'none',
    color: isPrimary ? INBOX_TOKENS.textInverted : INBOX_TOKENS.textPrimary,
    cursor: isDisabled ? 'default' : 'pointer',
    display: 'inline-flex',
    filter: isPrimary && isHovered && !isDisabled ? 'brightness(1.08)' : 'none',
    flexShrink: 0,
    fontFamily: 'inherit',
    fontSize: isSmall ? 12.5 : 13,
    fontWeight: 500,
    gap: 6,
    height: isSmall ? 28 : 32,
    opacity: isDisabled ? 0.6 : 1,
    padding: isSmall ? '0 10px' : '0 12px',
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
        {trailingIcon}
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
      {trailingIcon}
    </button>
  );
};
