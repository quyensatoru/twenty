import { type ReactNode } from 'react';

import { MOMENTS_TOKENS } from './moments-tokens';

type MomentsFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export const MomentsField = ({ label, hint, children }: MomentsFieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <span style={{ color: MOMENTS_TOKENS.textTertiary, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
    {children}
    {hint === undefined ? null : (
      <span style={{ color: MOMENTS_TOKENS.textTertiary, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 11, lineHeight: 1.4 }}>
        {hint}
      </span>
    )}
  </div>
);
