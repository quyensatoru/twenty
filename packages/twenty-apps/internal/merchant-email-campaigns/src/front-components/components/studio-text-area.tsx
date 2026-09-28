import { useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { getStudioControlStyle } from './studio-control-styles';

type StudioTextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

export const StudioTextArea = ({
  value,
  onChange,
  rows = 5,
  placeholder,
}: StudioTextAreaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <textarea
      key={fieldKey}
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
        ...getStudioControlStyle(isFocused),
        lineHeight: 1.5,
        padding: '8px',
        resize: 'vertical',
      }}
    />
  );
};
