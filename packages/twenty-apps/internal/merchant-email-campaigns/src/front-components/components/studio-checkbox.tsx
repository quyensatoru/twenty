import { IconCheck } from 'twenty-ui/icon';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioCheckboxProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

// Drawn after twenty-ui's Checkbox: that one builds a synthetic PointerEvent
// on click, which the sandbox cannot construct, and the front component
// crashes.
export const StudioCheckbox = ({
  checked,
  label,
  onChange,
}: StudioCheckboxProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      alignItems: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: STUDIO_TOKENS.radiusSmall,
      color: STUDIO_TOKENS.textPrimary,
      cursor: 'pointer',
      display: 'inline-flex',
      fontFamily: STUDIO_TOKENS.fontFamily,
      fontSize: 13,
      gap: 8,
      padding: '4px 4px 4px 0',
    }}
  >
    <span
      style={{
        alignItems: 'center',
        background: checked ? STUDIO_TOKENS.accent : 'transparent',
        border: `1px solid ${checked ? STUDIO_TOKENS.accent : STUDIO_TOKENS.borderStrong}`,
        borderRadius: 3,
        boxSizing: 'border-box',
        display: 'inline-flex',
        flexShrink: 0,
        height: 16,
        justifyContent: 'center',
        width: 16,
      }}
    >
      {checked ? <IconCheck size={12} color="#ffffff" stroke={3} /> : null}
    </span>
    {label}
  </button>
);
