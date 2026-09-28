import { IconCheck } from 'twenty-ui/icon';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftCheckboxProps = {
  checked: boolean;
  isDisabled?: boolean;
  ariaLabel: string;
  onChange: (checked: boolean) => void;
};

// Drawn after twenty-ui's Checkbox: that one builds a synthetic PointerEvent on
// click, which the sandbox cannot construct, and the front component crashes.
export const ShiftCheckbox = ({
  checked,
  isDisabled = false,
  ariaLabel,
  onChange,
}: ShiftCheckboxProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={isDisabled}
    onClick={() => onChange(!checked)}
    style={{
      alignItems: 'center',
      background: checked ? SHIFT_TOKENS.accent : 'transparent',
      border: `1px solid ${checked ? SHIFT_TOKENS.accent : SHIFT_TOKENS.borderStrong}`,
      borderRadius: 3,
      boxSizing: 'border-box',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      flexShrink: 0,
      height: 16,
      justifyContent: 'center',
      opacity: isDisabled ? 0.5 : 1,
      padding: 0,
      width: 16,
    }}
  >
    {checked ? <IconCheck size={12} color="#ffffff" stroke={3} /> : null}
  </button>
);
