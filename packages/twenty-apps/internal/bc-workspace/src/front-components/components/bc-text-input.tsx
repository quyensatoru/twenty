import { type ReactNode } from 'react';
import { Input, InputGroup, Textarea } from 'twenty-ui/primitives/input';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { BC_TOKENS } from './bc-theme';

type BcTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'url' | 'search';
  startElement?: ReactNode;
  endElement?: ReactNode;
  hasError?: boolean;
  maxLength?: number;
  min?: string;
  max?: string;
};

// twenty-ui's Input behind the stable-value guard the sandbox needs: the host
// re-applies every rendered value, so a lagging render would drop keys. It
// also needs `value`; `defaultValue` renders empty in the sandbox.
export const BcTextInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  type = 'text',
  startElement,
  endElement,
  hasError = false,
  maxLength,
  min,
  max,
}: BcTextInputProps) => {
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);
  const input = (
    <Input
      key={fieldKey}
      type={type}
      size="md"
      aria-label={ariaLabel}
      aria-invalid={hasError}
      value={fieldValue}
      placeholder={placeholder}
      maxLength={maxLength}
      min={min}
      max={max}
      onChange={(event) => {
        report(event.target.value);
        onChange(event.target.value);
      }}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        ...(hasError ? { borderColor: BC_TOKENS.danger } : {}),
      }}
    />
  );

  if (startElement === undefined && endElement === undefined) {
    return input;
  }

  return (
    <InputGroup
      size="md"
      startElement={startElement}
      endElement={endElement}
      style={hasError ? { borderColor: BC_TOKENS.danger } : undefined}
    >
      {input}
    </InputGroup>
  );
};

export const BcTextArea = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  hasError = false,
  maxLength,
}: Pick<
  BcTextInputProps,
  'value' | 'onChange' | 'ariaLabel' | 'placeholder' | 'hasError' | 'maxLength'
>) => {
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <Textarea
      key={fieldKey}
      size="md"
      aria-label={ariaLabel}
      aria-invalid={hasError}
      value={fieldValue}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={4}
      onChange={(event) => {
        report(event.target.value);
        onChange(event.target.value);
      }}
      // autoResize measures the field, and the sandbox's first measure is 0.
      style={{
        boxSizing: 'border-box',
        minHeight: 88,
        resize: 'vertical',
        width: '100%',
        ...(hasError ? { borderColor: BC_TOKENS.danger } : {}),
      }}
    />
  );
};

export const BcField = ({
  label,
  isRequired = false,
  error,
  hint,
  children,
}: {
  label: string;
  isRequired?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span
      style={{
        color: BC_TOKENS.textTertiary,
        fontSize: BC_TOKENS.fontSizeSm,
        fontWeight: BC_TOKENS.fontWeightMedium,
      }}
    >
      {label}
      {isRequired ? ' *' : ''}
    </span>
    {children}
    {typeof error === 'string' && error.length > 0 ? (
      <span style={{ color: BC_TOKENS.danger, fontSize: BC_TOKENS.fontSizeSm }}>
        {error}
      </span>
    ) : hint !== undefined ? (
      <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
        {hint}
      </span>
    ) : null}
  </label>
);
