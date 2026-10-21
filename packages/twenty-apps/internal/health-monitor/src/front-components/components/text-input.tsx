import { Input } from 'twenty-ui/primitives/input';

import { useStableFieldValue } from '../hooks/use-stable-field-value';

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'url' | 'email' | 'number' | 'search';
  width?: number | string;
  onEnter?: () => void;
  disabled?: boolean;
};

// Wraps twenty-ui's Input with the stable-value guard the sandbox needs: the
// host re-applies every rendered value, so a lagging render would drop keys.
export const TextInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  type = 'text',
  width = '100%',
  onEnter,
  disabled,
}: TextInputProps) => {
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <Input
      key={fieldKey}
      type={type}
      size="md"
      aria-label={ariaLabel}
      value={fieldValue}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => {
        report(event.target.value);
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onEnter !== undefined) {
          onEnter();
        }
      }}
      style={{ width }}
    />
  );
};
