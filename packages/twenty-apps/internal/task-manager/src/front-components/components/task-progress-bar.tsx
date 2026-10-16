import { TASK_TOKENS } from './task-tokens';

type TaskProgressSegment = {
  value: number;
  color: string;
  label: string;
};

type TaskProgressBarProps = {
  segments: readonly TaskProgressSegment[];
  total: number;
  width?: number | string;
  height?: number;
};

// A stacked bar: done first, then in progress, the rest left as track, so a
// sprint's shape reads before its numbers do.
export const TaskProgressBar = ({
  segments,
  total,
  width = 120,
  height = 6,
}: TaskProgressBarProps) => {
  const title = segments
    .map((segment) => `${segment.value} ${segment.label.toLowerCase()}`)
    .join(' · ');

  return (
    <span
      title={title}
      style={{
        background: TASK_TOKENS.backgroundTertiary,
        borderRadius: height / 2,
        display: 'inline-flex',
        flexShrink: 0,
        height,
        overflow: 'hidden',
        width,
      }}
    >
      {total > 0 &&
        segments.map((segment) => (
          <span
            key={segment.label}
            style={{
              background: segment.color,
              display: 'block',
              height: '100%',
              width: `${Math.min(100, (segment.value / total) * 100)}%`,
            }}
          />
        ))}
    </span>
  );
};
