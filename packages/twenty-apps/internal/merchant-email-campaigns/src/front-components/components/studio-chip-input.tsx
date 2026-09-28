import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';

import { StudioTagButton } from './studio-tag-button';
import { StudioTextInput } from './studio-text-input';

type StudioChipInputProps = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: readonly string[];
};

export const StudioChipInput = ({
  values,
  onChange,
  placeholder,
  suggestions = [],
}: StudioChipInputProps) => {
  const [draft, setDraft] = useState('');
  const [inputKey, setInputKey] = useState(0);

  const addValue = (rawValue: string) => {
    const nextValues = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value !== '' && !values.includes(value));

    if (nextValues.length > 0) {
      onChange([...values, ...nextValues]);
    }

    setDraft('');
    setInputKey((current) => current + 1);
  };

  const unusedSuggestions = suggestions.filter(
    (suggestion) => !values.includes(suggestion),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {values.length === 0 ? null : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {values.map((value) => (
            <StudioTagButton
              key={value}
              title={t('Remove {value}', { value })}
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              {value}
              <IconX size={12} />
            </StudioTagButton>
          ))}
        </div>
      )}
      <StudioTextInput
        key={inputKey}
        value={draft}
        placeholder={placeholder ?? t('Type and press Enter')}
        onChange={setDraft}
        onEnter={() => addValue(draft)}
        onBlur={() => addValue(draft)}
      />
      {unusedSuggestions.length === 0 ? null : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {unusedSuggestions.map((suggestion) => (
            <StudioTagButton
              key={suggestion}
              isDashed
              onClick={() => onChange([...values, suggestion])}
            >
              {`+ ${suggestion}`}
            </StudioTagButton>
          ))}
        </div>
      )}
    </div>
  );
};
