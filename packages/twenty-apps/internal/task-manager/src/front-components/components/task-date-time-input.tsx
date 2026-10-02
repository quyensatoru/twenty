import { useState } from 'react';

import { getTaskControlStyle, TASK_BARE_FIELD_STYLE } from './task-control-styles';

type TaskDateTimeInputProps = {
  // 'YYYY-MM-DDTHH:mm' in local time, the datetime-local wire format.
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  width?: number | string;
};

// The native control, shown as itself.
//
// It used to be covered by this component's own icon and locale-formatted text,
// with the real input laid over at opacity 0 — closer to Twenty's look, but it
// could not be opened: Chrome opens a datetime-local picker only from the
// calendar glyph, and the glyph was invisible. Reaching it any other way needs
// what an app cannot have — `::-webkit-calendar-picker-indicator` wants a
// stylesheet, and `showPicker()` is a DOM method the sandbox does not forward.
//
// So the browser's own glyph is left visible and the frame around it is the
// only thing this component styles.
export const TaskDateTimeInput = ({
  value,
  onChange,
  ariaLabel,
  width = 220,
}: TaskDateTimeInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      style={{
        ...getTaskControlStyle(isFocused),
        alignItems: 'center',
        display: 'flex',
        height: 32,
        padding: '0 8px',
        width,
      }}
    >
      <input
        aria-label={ariaLabel}
        type="datetime-local"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...TASK_BARE_FIELD_STYLE, height: '100%' }}
      />
    </div>
  );
};
