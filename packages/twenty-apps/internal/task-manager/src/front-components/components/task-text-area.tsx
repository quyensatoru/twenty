import { useState } from 'react';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { getTaskControlStyle } from './task-control-styles';

type TaskTextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  rows?: number;
};

export const TaskTextArea = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  rows = 3,
}: TaskTextAreaProps) => {
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
        ...getTaskControlStyle(isFocused),
        lineHeight: 1.5,
        padding: 8,
        resize: 'vertical',
      }}
    />
  );
};
