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
        borderRadius: TASK_TOKENS.radiusExtraSmall,
        color: tone.text,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        // The host's own Tag: a 20px pill, 13px regular text, 8px of inset.
        // 11px semibold in a 6px pill read as a different control entirely.
        boxSizing: 'border-box',
        fontSize: 13,
        fontWeight: 400,
        height: 20,
        maxWidth: 160,
        overflow: 'hidden',
        padding: '0 8px',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};
