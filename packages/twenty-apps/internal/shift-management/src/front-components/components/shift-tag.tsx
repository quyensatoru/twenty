import { SHIFT_TOKENS } from './shift-tokens';

export type ShiftTagTone = 'blue' | 'green' | 'gray' | 'red' | 'orange' | 'yellow';

const TONE_STYLES: Record<ShiftTagTone, { background: string; color: string }> =
  {
    blue: { background: 'var(--t-tag-background-blue, #e8efff)', color: 'var(--t-tag-text-blue, #1450c7)' },
    green: { background: SHIFT_TOKENS.greenSoft, color: SHIFT_TOKENS.greenText },
    gray: { background: 'var(--t-tag-background-gray, #f1f1f1)', color: 'var(--t-tag-text-gray, #666666)' },
    red: { background: SHIFT_TOKENS.redSoft, color: SHIFT_TOKENS.redText },
    orange: { background: 'var(--t-tag-background-orange, #fdeee3)', color: 'var(--t-tag-text-orange, #b45309)' },
    yellow: { background: 'var(--t-tag-background-yellow, #fdf4dc)', color: 'var(--t-tag-text-yellow, #8a6100)' },
  };

type ShiftTagProps = { label: string; tone: ShiftTagTone };

// twenty-ui's Tag renders fine in the sandbox, but drawing it here keeps the
// tone palette in one place next to the chips that share it.
export const ShiftTag = ({ label, tone }: ShiftTagProps) => {
  const style = TONE_STYLES[tone];

  return (
    <span
      style={{
        alignItems: 'center',
        background: style.background,
        borderRadius: SHIFT_TOKENS.radiusSmall,
        color: style.color,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: SHIFT_TOKENS.fontFamily,
        fontSize: 11,
        fontWeight: 500,
        height: 20,
        padding: '0 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

// Status -> tag tone, shared by the Today panel, the week list and the report
// table so one shift never reads differently on two screens.
export const getShiftStatusTone = (status: string): ShiftTagTone => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'green';
    case 'COMPLETED':
      return 'gray';
    case 'CANCELLED':
      return 'red';
    default:
      return 'blue';
  }
};
