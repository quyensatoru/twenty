import { useState } from 'react';
import { IconCalendar } from 'twenty-ui/icon';

import { getTaskControlStyle } from './task-control-styles';
import { TASK_TOKENS } from './task-tokens';

type TaskDateTimeInputProps = {
  // 'YYYY-MM-DDTHH:mm' in local time, the datetime-local wire format.
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  width?: number | string;
};

const formatDisplayValue = (value: string): string => {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
};

// Twenty has no `datetime-local` anywhere in its own UI — its date fields are a
// text field plus its own picker — so a raw one is the single most obviously
// "not Twenty" control on the page.
//
// The real input is kept for correct parsing and for the browser's picker, but
// laid over the control at opacity 0; what the user sees is this component's
// own icon and locale-formatted text. Hiding the native glyph properly would
// need `::-webkit-calendar-picker-indicator`, and an app cannot ship a
// stylesheet, so covering it is the only route that stays inline.
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
        gap: 6,
        height: 32,
        padding: '0 8px',
        position: 'relative',
        width,
      }}
    >
      <IconCalendar size={14} color={TASK_TOKENS.textTertiary} />
      <span
        style={{
          color: TASK_TOKENS.textPrimary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {formatDisplayValue(value)}
      </span>
      <input
        aria-label={ariaLabel}
        type="datetime-local"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        style={{
          border: 'none',
          cursor: 'pointer',
          height: '100%',
          left: 0,
          opacity: 0,
          padding: 0,
          position: 'absolute',
          top: 0,
          width: '100%',
        }}
      />
    </div>
  );
};
