import { type ReactNode } from 'react';

import { type InboxTone } from './inbox-tokens';

type InboxPillProps = {
  tone: InboxTone;
  children: ReactNode;
  icon?: ReactNode;
  size?: 'small' | 'medium';
  title?: string;
};

export const InboxPill = ({
  tone,
  children,
  icon,
  size = 'small',
  title,
}: InboxPillProps) => (
  <span
    title={title}
    style={{
      alignItems: 'center',
      background: tone.background,
      borderRadius: 999,
      color: tone.text,
      display: 'inline-flex',
      flexShrink: 0,
      fontSize: size === 'small' ? 11 : 12,
      fontWeight: 600,
      gap: 4,
      height: size === 'small' ? 20 : 24,
      lineHeight: 1,
      maxWidth: '100%',
      overflow: 'hidden',
      padding: size === 'small' ? '0 8px' : '0 10px',
      whiteSpace: 'nowrap',
    }}
  >
    {icon}
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {children}
    </span>
  </span>
);
