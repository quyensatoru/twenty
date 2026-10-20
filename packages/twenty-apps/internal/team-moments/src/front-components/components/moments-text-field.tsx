import { type KeyboardEvent, type Ref, useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { MOMENTS_TOKENS } from './moments-tokens';

type MomentsTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'time';
  isMultiline?: boolean;
  rows?: number;
  onEnter?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => boolean;
  inputRef?: Ref<HTMLInputElement>;
  onPasteTransfer?: (transfer: unknown) => void;
};

const getControlStyle = (isFocused: boolean) =>
  ({
    background: MOMENTS_TOKENS.backgroundTransparentLighter,
    border: `1px solid ${isFocused ? MOMENTS_TOKENS.accent : MOMENTS_TOKENS.border}`,
    borderRadius: MOMENTS_TOKENS.radiusSmall,
    boxShadow: isFocused ? `0 0 0 3px ${MOMENTS_TOKENS.accentSoft}` : 'none',
    boxSizing: 'border-box',
    color: MOMENTS_TOKENS.textPrimary,
    fontFamily: MOMENTS_TOKENS.fontFamily,
    fontSize: 13,
    outline: 'none',
    width: '100%',
  }) as const;

export const MomentsTextField = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  type = 'text',
  isMultiline = false,
  rows = 3,
  onEnter,
  onKeyDown,
  inputRef,
  onPasteTransfer,
}: MomentsTextFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  const handleChange = (nextValue: string) => {
    report(nextValue);
    onChange(nextValue);
  };

  if (isMultiline) {
    return (
      <textarea
        key={fieldKey}
        aria-label={ariaLabel}
        value={fieldValue}
        rows={rows}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => handleChange(event.target.value)}
        style={{ ...getControlStyle(isFocused), lineHeight: 1.5, padding: 8, resize: 'vertical' }}
      />
    );
  }

  return (
    <input
      key={fieldKey}
      ref={inputRef}
      type={type}
      aria-label={ariaLabel}
      value={fieldValue}
      placeholder={placeholder}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(event) => handleChange(event.target.value)}
      onKeyDown={(event) => {
        if (onKeyDown?.(event)) return;
        if (event.key === 'Enter' && onEnter !== undefined) {
          onEnter();
        }
      }}
      onPaste={(event) => onPasteTransfer?.(event.clipboardData)}
      style={{ ...getControlStyle(isFocused), height: 32, padding: '0 8px' }}
    />
  );
};
