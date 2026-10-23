import { type ReactNode } from 'react';
import { Input, InputGroup, Textarea } from 'twenty-ui/primitives/input';

import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { DISCOUNT_TOKENS, spacing } from './discount-theme';

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'password' | 'url' | 'search';
  startElement?: ReactNode;
  endElement?: ReactNode;
  hasError?: boolean;
};

// twenty-ui's Input behind the stable-value guard the sandbox needs: the host
// re-applies every rendered value, so a lagging render would drop keys.
export const TextInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  type = 'text',
  startElement,
  endElement,
  hasError = false,
}: TextInputProps) => {
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
      onChange={(event) => {
        report(event.target.value);
        onChange(event.target.value);
      }}
      style={{
        width: '100%',
        ...(hasError ? { borderColor: DISCOUNT_TOKENS.danger } : {}),
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
      style={hasError ? { borderColor: DISCOUNT_TOKENS.danger } : undefined}
    >
      {input}
    </InputGroup>
  );
};

export const TextAreaInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  hasError = false,
}: Pick<TextInputProps, 'value' | 'onChange' | 'ariaLabel' | 'placeholder' | 'hasError'>) => {
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <Textarea
      key={fieldKey}
      size="md"
      aria-label={ariaLabel}
      aria-invalid={hasError}
      value={fieldValue}
      placeholder={placeholder}
      rows={4}
      onValueChange={(next) => {
        report(next);
        onChange(next);
      }}
      // autoResize measures the element, which reads 0 in the sandbox.
      style={{
        minHeight: 88,
        resize: 'vertical',
        ...(hasError ? { borderColor: DISCOUNT_TOKENS.danger } : {}),
      }}
    />
  );
};

type FieldProps = {
  label: string;
  aside?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
};

export const Field = ({ label, aside, hint, error, children }: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), minWidth: 0 }}>
    <span
      style={{
        color: DISCOUNT_TOKENS.textSecondary,
        display: 'flex',
        fontSize: DISCOUNT_TOKENS.fontSizeSm,
        fontWeight: DISCOUNT_TOKENS.fontWeightMedium,
        gap: spacing(2),
        justifyContent: 'space-between',
      }}
    >
      <span>{label}</span>
      {aside !== undefined && (
        <span style={{ color: DISCOUNT_TOKENS.textTertiary, fontWeight: 'normal' }}>{aside}</span>
      )}
    </span>
    {children}
    {error !== undefined ? (
      <span style={{ color: DISCOUNT_TOKENS.danger, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>{error}</span>
    ) : (
      hint !== undefined && (
        <span style={{ color: DISCOUNT_TOKENS.textTertiary, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>{hint}</span>
      )
    )}
  </div>
);

export const InputSuffix = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      color: DISCOUNT_TOKENS.textTertiary,
      fontSize: DISCOUNT_TOKENS.fontSizeSm,
      paddingRight: spacing(2),
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);
