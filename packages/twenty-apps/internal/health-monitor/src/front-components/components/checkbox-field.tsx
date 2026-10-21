import { Checkbox } from 'twenty-ui/primitives/input';

import { HEALTH_TOKENS, spacing } from './health-tokens';

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  hint?: string;
  disabled?: boolean;
};

// Toggles report intent instead of a value, so a handler the sandbox kept
// from an older render still flips the current state.
export const CheckboxField = ({
  label,
  checked,
  onToggle,
  hint,
  disabled,
}: CheckboxFieldProps) => (
  <label
    style={{
      display: 'flex',
      alignItems: hint === undefined ? 'center' : 'flex-start',
      gap: spacing(2),
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    <Checkbox
      checked={checked}
      disabled={disabled}
      onCheckedChange={() => onToggle()}
      size="md"
      color="accent"
      hoverable={false}
    />
    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {label}
      {hint !== undefined && (
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textTertiary,
          }}
        >
          {hint}
        </span>
      )}
    </span>
  </label>
);
