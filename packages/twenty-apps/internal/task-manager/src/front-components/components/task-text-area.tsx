import { useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskTextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel: string;
};

// Twenty's text-field look, rebuilt from a plain textarea: twenty-ui's inputs
// are base-ui backed and construct PointerEvents the sandbox has no
// constructor for. Focus styling is state-driven because an app cannot ship a
// stylesheet, so there is no `:focus` to declare.
export const TaskTextArea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  ariaLabel,
}: TaskTextAreaProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <textarea
      aria-label={ariaLabel}
      value={value}
      rows={rows}
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
        outline: 'none',
        padding: 8,
        resize: 'vertical',
        width: '100%',
      }}
    />
  );
};
