import { useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  type?: 'text' | 'datetime-local';
  width?: number | string;
};

export const TaskTextInput = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  type = 'text',
  width = '100%',
}: TaskTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      aria-label={ariaLabel}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        background: TASK_TOKENS.backgroundTransparentLighter,
        border: `1px solid ${isFocused ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxShadow: isFocused ? `0 0 0 3px ${TASK_TOKENS.accentSoft}` : 'none',
        boxSizing: 'border-box',
        color: TASK_TOKENS.textPrimary,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        height: 28,
        outline: 'none',
        padding: '0 8px',
        width,
      }}
    />
  );
};
