import type { CSSProperties, ReactNode } from 'react';

import { TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

type TaskEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  style?: CSSProperties;
};

// One shared empty state so every tab reads as the same product: a soft icon,
// a semibold title and a single hint line on a quiet panel.
export const TaskEmptyState = ({
  icon,
  title,
  description,
  style,
}: TaskEmptyStateProps) => (
  <div
    style={{
      alignItems: 'center',
      background: TASK_TOKENS.backgroundSecondary,
      border: `1px solid ${TASK_TOKENS.borderLight}`,
      borderRadius: TASK_TOKENS.radius,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      padding: '24px 16px',
      textAlign: 'center',
      ...style,
    }}
  >
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background: TASK_TOKENS.backgroundTertiary,
        ...TASK_CIRCLE_STYLE,
        color: TASK_TOKENS.textTertiary,
        display: 'flex',
        height: 32,
        justifyContent: 'center',
        width: 32,
      }}
    >
      {icon}
    </span>
    <p
      style={{
        color: TASK_TOKENS.textPrimary,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        margin: 0,
      }}
    >
      {title}
    </p>
    {typeof description === 'string' && description !== '' && (
      <p
        style={{
          color: TASK_TOKENS.textTertiary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 12,
          lineHeight: 1.5,
          margin: 0,
          maxWidth: 320,
        }}
      >
        {description}
      </p>
    )}
  </div>
);
