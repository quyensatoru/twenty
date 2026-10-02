import { type ReactNode, useState } from 'react';

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
  onEnter?: () => void;
  onBlur?: () => void;
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
  onBlur,
  shouldAutoFocus = false,
  width = '100%',
  height = 32,
}: TaskTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

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
        aria-label={ariaLabel}
        type={type}
        value={fieldValue}
        placeholder={placeholder}
        autoFocus={shouldAutoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onEnter?.();
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
