import { type ReactNode } from 'react';

import { readTagColor, TASK_TOKENS } from './task-tokens';

type TaskTagProps = {
  children: ReactNode;
  color?: string | null;
};

export const TaskTag = ({ children, color }: TaskTagProps) => {
  const tone = readTagColor(color);

  return (
    <span
      style={{
        alignItems: 'center',
        background: tone.background,
        borderRadius: TASK_TOKENS.radiusSmall,
        color: tone.text,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '16px',
        maxWidth: 160,
        overflow: 'hidden',
        padding: '1px 6px',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};
