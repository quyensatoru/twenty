import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { getTaskControlStyle, TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TASK_TOKENS } from './task-tokens';

type TaskTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'datetime-local';
  prefixIcon?: ReactNode;
  suffix?: ReactNode;
  onEnter?: (value: string) => void;
  onEscape?: () => void;
  onBlur?: (value: string) => void;
  shouldAutoFocus?: boolean;
  width?: number | string;
  height?: number;
};

export const TaskTextInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  type = 'text',
  prefixIcon,
  suffix,
  onEnter,
  onEscape,
  onBlur,
  shouldAutoFocus = false,
  width = '100%',
  height = 32,
}: TaskTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The sandbox renders custom elements, on which React's autoFocus is a
  // no-op, so focus is requested by hand. fieldKey remounts the input.
  useEffect(() => {
    if (shouldAutoFocus) {
      inputRef.current?.focus();
    }
  }, [shouldAutoFocus, fieldKey]);

  return (
    <div
      style={{
        ...getTaskControlStyle(isFocused),
        alignItems: 'center',
        display: 'flex',
        gap: 6,
        height,
        padding: '0 8px',
        width,
      }}
    >
      {prefixIcon}
      <input
        key={fieldKey}
        ref={inputRef}
        aria-label={ariaLabel}
        type={type}
        value={fieldValue}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          setIsFocused(false);
          // Reads the field's own live value rather than the caller's
          // mirrored state: that state is fed by onChange on a separate,
          // asynchronous round trip to the host, and a blur fired right after
          // the last keystroke can beat it there, saving text one character
          // short.
          onBlur?.(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onEnter?.(event.currentTarget.value);
          } else if (event.key === 'Escape' && onEscape !== undefined) {
            // Keeps a surrounding modal open: Escape cancels this field only.
            event.stopPropagation();
            onEscape();
          }
        }}
        onChange={(event) => {
          report(event.target.value);
          onChange(event.target.value);
        }}
        style={{
          ...TASK_BARE_FIELD_STYLE,
          // Strips the browser's own spinner and date glyph so a
          // datetime-local field reads as a Twenty field rather than as raw
          // browser chrome. Cosmetic only — the native picker still opens.
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
          appearance: 'none',
          colorScheme: 'inherit',
        }}
      />
      {suffix === undefined ? null : (
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
          {suffix}
        </span>
      )}
    </div>
  );
};
