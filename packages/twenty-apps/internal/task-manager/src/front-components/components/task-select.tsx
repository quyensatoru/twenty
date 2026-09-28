import { TASK_TOKENS } from './task-tokens';

type TaskSelectProps = {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
};

export const TaskSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
}: TaskSelectProps) => (
  <select
    aria-label={ariaLabel}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    style={{
      background: TASK_TOKENS.background,
      border: `1px solid ${TASK_TOKENS.border}`,
      borderRadius: TASK_TOKENS.radiusSmall,
      color: TASK_TOKENS.textPrimary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      height: 24,
      maxWidth: 260,
      padding: '0 6px',
    }}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
