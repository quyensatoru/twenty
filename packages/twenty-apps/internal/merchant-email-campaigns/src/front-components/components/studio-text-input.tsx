import { type ReactNode, useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { getStudioControlStyle } from './studio-control-styles';
import { STUDIO_TOKENS } from './studio-tokens';

type StudioTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'url' | 'number' | 'datetime-local';
  suffix?: ReactNode;
  onEnter?: () => void;
  onBlur?: () => void;
};

export const StudioTextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
  onEnter,
  onBlur,
}: StudioTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <div
      style={{
        ...getStudioControlStyle(isFocused),
        alignItems: 'center',
        display: 'flex',
        height: 32,
        padding: '0 8px',
      }}
    >
      <input
        key={fieldKey}
        type={type}
        value={fieldValue}
        placeholder={placeholder}
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
          background: 'transparent',
          border: 'none',
          color: STUDIO_TOKENS.textPrimary,
          flex: 1,
          fontFamily: STUDIO_TOKENS.fontFamily,
          fontSize: 13,
          minWidth: 0,
          outline: 'none',
          padding: 0,
        }}
      />
      {suffix === undefined ? null : (
        <span
          style={{
            color: STUDIO_TOKENS.textTertiary,
            fontSize: 13,
            marginLeft: 4,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
};
