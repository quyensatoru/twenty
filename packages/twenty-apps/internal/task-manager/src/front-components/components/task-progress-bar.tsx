import { TASK_TOKENS } from './task-tokens';

type TaskProgressBarProps = { percentage: number };

export const TaskProgressBar = ({ percentage }: TaskProgressBarProps) => (
  <div
    role="progressbar"
    aria-valuenow={percentage}
    aria-valuemin={0}
    aria-valuemax={100}
    style={{
      background: TASK_TOKENS.backgroundTertiary,
      borderRadius: 999,
      height: 4,
      overflow: 'hidden',
      width: '100%',
    }}
  >
    <div
      style={{
        background: TASK_TOKENS.accent,
        height: '100%',
        width: `${Math.max(0, Math.min(100, percentage))}%`,
      }}
    />
  </div>
);
