import { type ReactNode } from 'react';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftCardProps = {
  value: string;
  label: string;
  isAlert?: boolean;
};

export const ShiftStatCard = ({ value, label, isAlert }: ShiftCardProps) => (
  <div
    style={{
      background: SHIFT_TOKENS.background,
      border: `1px solid ${SHIFT_TOKENS.borderLight}`,
      borderRadius: SHIFT_TOKENS.radius,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 120,
      padding: '12px 16px',
    }}
  >
    <span
      style={{
        color: isAlert === true ? SHIFT_TOKENS.red : SHIFT_TOKENS.textPrimary,
        fontFamily: SHIFT_TOKENS.fontFamily,
        fontSize: 20,
        fontWeight: 600,
      }}
    >
      {value}
    </span>
    <span
      style={{
        color: SHIFT_TOKENS.textTertiary,
        fontFamily: SHIFT_TOKENS.fontFamily,
        fontSize: 12,
      }}
    >
      {label}
    </span>
  </div>
);

type ShiftSectionProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export const ShiftSection = ({
  title,
  actions,
  children,
}: ShiftSectionProps) => (
  <section
    style={{
      background: SHIFT_TOKENS.background,
      border: `1px solid ${SHIFT_TOKENS.border}`,
      borderRadius: SHIFT_TOKENS.radius,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0,
      padding: 16,
    }}
  >
    {title === undefined && actions === undefined ? null : (
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            color: SHIFT_TOKENS.textSecondary,
            fontFamily: SHIFT_TOKENS.fontFamily,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h3>
        {actions}
      </header>
    )}
    {children}
  </section>
);
