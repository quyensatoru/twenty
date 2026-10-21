import { type ReactNode } from 'react';

import { HEALTH_TOKENS, spacing } from './health-tokens';

type LabeledFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  grow?: boolean;
};

export const LabeledField = ({
  label,
  hint,
  children,
  grow = false,
}: LabeledFieldProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(1),
      flex: grow ? '1 1 220px' : undefined,
      minWidth: 0,
    }}
  >
    <span
      style={{
        fontSize: HEALTH_TOKENS.fontSizeSm,
        color: HEALTH_TOKENS.textSecondary,
        fontWeight: HEALTH_TOKENS.fontWeightMedium,
      }}
    >
      {label}
    </span>
    {children}
    {hint !== undefined && (
      <span
        style={{
          fontSize: HEALTH_TOKENS.fontSizeSm,
          color: HEALTH_TOKENS.textTertiary,
        }}
      >
        {hint}
      </span>
    )}
  </div>
);
