import { type ReactNode } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskPageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export const TaskPageHeader = ({
  title,
  subtitle,
  children,
}: TaskPageHeaderProps) => (
  <header
    style={{
      alignItems: 'center',
      borderBottom: `1px solid ${TASK_TOKENS.border}`,
      display: 'flex',
      flexShrink: 0,
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      padding: '10px 16px',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <h1
        style={{
          color: TASK_TOKENS.textPrimary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 15,
          fontWeight: 600,
          margin: 0,
        }}
      >
        {title}
      </h1>
      {subtitle !== undefined && (
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
    <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
      {children}
    </div>
  </header>
);
