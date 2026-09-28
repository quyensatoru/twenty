import { useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { getShiftControlStyle } from './shift-control-style';

type ShiftTextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  ariaLabel?: string;
};

export const ShiftTextArea = ({
  value,
  onChange,
  rows = 3,
  placeholder,
  ariaLabel,
}: ShiftTextAreaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <textarea
      key={fieldKey}
      aria-label={ariaLabel}
      value={fieldValue}
      rows={rows}
      placeholder={placeholder}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(event) => {
        report(event.target.value);
        onChange(event.target.value);
      }}
      style={{
        ...getShiftControlStyle(isFocused),
        lineHeight: 1.5,
        padding: 8,
        resize: 'vertical',
      }}
    />
  );
};
