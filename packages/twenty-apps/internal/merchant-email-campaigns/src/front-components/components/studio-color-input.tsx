import { useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { getStudioControlStyle } from './studio-control-styles';
import { STUDIO_TOKENS } from './studio-tokens';

type StudioColorInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

// A swatch that opens the system picker, next to the hex value, so both a
// quick pick and an exact brand colour are one step away.
export const StudioColorInput = ({
  value,
  onChange,
}: StudioColorInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <div
      style={{
        ...getStudioControlStyle(isFocused),
        alignItems: 'center',
        display: 'flex',
        gap: 8,
        height: 32,
        padding: '0 8px',
      }}
    >
      <label
        style={{
          background: HEX_PATTERN.test(value) ? value : 'transparent',
          border: `1px solid ${STUDIO_TOKENS.borderStrong}`,
          borderRadius: 4,
          cursor: 'pointer',
          flexShrink: 0,
          height: 16,
          overflow: 'hidden',
          position: 'relative',
          width: 16,
        }}
      >
        <input
          type="color"
          value={HEX_PATTERN.test(value) ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          style={{
            cursor: 'pointer',
            inset: 0,
            opacity: 0,
            position: 'absolute',
          }}
        />
      </label>
      <input
        key={fieldKey}
        type="text"
        value={fieldValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
    </div>
  );
};
