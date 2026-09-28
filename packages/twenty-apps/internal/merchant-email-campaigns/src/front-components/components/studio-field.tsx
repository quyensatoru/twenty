import { type ReactNode } from 'react';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

// Label and description styled like twenty-ui's Field.
export const StudioField = ({ label, hint, children }: StudioFieldProps) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
  >
    <span
      style={{
        color: STUDIO_TOKENS.textTertiary,
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
          color: STUDIO_TOKENS.textTertiary,
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {hint}
      </span>
    )}
  </div>
);
