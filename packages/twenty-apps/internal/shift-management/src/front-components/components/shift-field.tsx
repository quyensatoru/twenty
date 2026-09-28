import { type ReactNode } from 'react';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export const ShiftField = ({ label, hint, children }: ShiftFieldProps) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
  >
    <span
      style={{
        color: SHIFT_TOKENS.textTertiary,
        fontFamily: SHIFT_TOKENS.fontFamily,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    {children}
    {hint === undefined ? null : (
      <span
        style={{
          color: SHIFT_TOKENS.textTertiary,
          fontFamily: SHIFT_TOKENS.fontFamily,
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {hint}
      </span>
    )}
  </div>
);
