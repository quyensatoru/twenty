import { SHIFT_TOKENS } from './shift-tokens';

type ShiftCodeChipProps = { code: string; color: string | null };

// Colored template chip; falls back to a neutral token background when the
// template was deactivated so the code stays readable instead of
// light-on-nothing.
export const ShiftCodeChip = ({ code, color }: ShiftCodeChipProps) => (
  <span
    style={{
      background: color ?? SHIFT_TOKENS.backgroundTertiary,
      borderRadius: SHIFT_TOKENS.radiusSmall,
      color: color === null ? SHIFT_TOKENS.textSecondary : SHIFT_TOKENS.textInverted,
      flexShrink: 0,
      fontFamily: SHIFT_TOKENS.fontFamily,
      fontSize: 11,
      fontWeight: 600,
      padding: '1px 5px',
      whiteSpace: 'nowrap',
    }}
  >
    {code}
  </span>
);
