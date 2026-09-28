import { type ReactNode } from 'react';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftStateMessageProps = {
  message: string;
  action?: ReactNode;
};

export const ShiftStateMessage = ({
  message,
  action,
}: ShiftStateMessageProps) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 32,
      textAlign: 'center',
    }}
  >
    <p
      style={{
        color: SHIFT_TOKENS.textSecondary,
        fontFamily: SHIFT_TOKENS.fontFamily,
        fontSize: 14,
        margin: 0,
      }}
    >
      {message}
    </p>
    {action}
  </div>
);
