import { IconSearch, IconX } from 'twenty-ui/icon';

import { TaskIconButton } from './task-icon-button';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

type TaskSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
};

export const TaskSearchInput = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
}: TaskSearchInputProps) => (
  <div style={{ alignItems: 'center', display: 'flex', gap: 4 }}>
    <TaskTextInput
      ariaLabel={ariaLabel}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      width={200}
      prefixIcon={<IconSearch size={14} color={TASK_TOKENS.textTertiary} />}
    />
    {value === '' ? null : (
      <TaskIconButton label={clearLabel} onClick={() => onChange('')}>
        <IconX size={14} />
      </TaskIconButton>
    )}
  </div>
);
