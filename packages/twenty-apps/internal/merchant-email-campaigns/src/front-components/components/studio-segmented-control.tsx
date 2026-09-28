import { t } from 'twenty-sdk/front-component';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioSegmentedControlProps<TValue extends string> = {
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
  ariaLabel?: string;
};

// Drawn here rather than with twenty-ui's SegmentedControl: that one positions
// its selection indicator by measuring the DOM, which the sandbox does not
// expose, and renders as unstyled text inside a front component.
export const StudioSegmentedControl = <TValue extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: StudioSegmentedControlProps<TValue>) => (
  <div
    role="group"
    aria-label={ariaLabel}
    style={{
      background: STUDIO_TOKENS.backgroundTertiary,
      borderRadius: STUDIO_TOKENS.radius,
      display: 'inline-flex',
      gap: 2,
      padding: 2,
    }}
  >
    {options.map((option) => {
      const isSelected = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onChange(option.value)}
          style={{
            background: isSelected ? STUDIO_TOKENS.background : 'transparent',
            border: `1px solid ${isSelected ? STUDIO_TOKENS.border : 'transparent'}`,
            borderRadius: STUDIO_TOKENS.radiusSmall,
            boxShadow: isSelected
              ? 'var(--t-box-shadow-light, 0 1px 2px rgba(0,0,0,0.08))'
              : 'none',
            color: isSelected
              ? STUDIO_TOKENS.textPrimary
              : STUDIO_TOKENS.textSecondary,
            cursor: 'pointer',
            fontFamily: STUDIO_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 500,
            height: 26,
            padding: '0 10px',
            whiteSpace: 'nowrap',
          }}
        >
          {t(option.label)}
        </button>
      );
    })}
  </div>
);
