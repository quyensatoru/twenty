import { readTagColor } from './task-tokens';

export type TaskStatusGlyph =
  | 'backlog'
  | 'unstarted'
  | 'started'
  | 'review'
  | 'done'
  | 'canceled';

type TaskStatusIconProps = {
  glyph: TaskStatusGlyph;
  color?: string | null;
  size?: number;
  title?: string;
};

type StatusLike = {
  id: string;
  name?: string | null;
  category?: string | null;
  position?: number | null;
};

// A status category alone cannot tell Backlog from Todo or In Progress from
// In Review, and those are the distinctions a reader scans a board for. The
// name settles the two conventional ones; otherwise a later STARTED status
// reads as further along than an earlier one.
export const readStatusGlyph = (
  status: StatusLike | null | undefined,
  statuses: readonly StatusLike[] = [],
): TaskStatusGlyph => {
  if (status === null || status === undefined) {
    return 'backlog';
  }

  const name = (status.name ?? '').toLowerCase();

  if (status.category === 'DONE') {
    return /cancel|won.?t|duplicate|reject/.test(name) ? 'canceled' : 'done';
  }

  if (status.category === 'STARTED') {
    if (/review|qa|test|verify/.test(name)) {
      return 'review';
    }

    const started = statuses
      .filter((candidate) => candidate.category === 'STARTED')
      .sort((left, right) => (left.position ?? 0) - (right.position ?? 0));

    return started.length > 1 && started[started.length - 1]?.id === status.id
      ? 'review'
      : 'started';
  }

  return /backlog|icebox|triage/.test(name) ? 'backlog' : 'unstarted';
};

// Linear's status marks: a dashed ring for backlog, an empty ring for to do,
// a ring filling clockwise as the work moves, a solid disc once done. Drawn in
// SVG because no tabler icon carries progress.
export const TaskStatusIcon = ({
  glyph,
  color,
  size = 14,
  title,
}: TaskStatusIconProps) => {
  const tone = readTagColor(color ?? 'gray').text;
  const center = 8;
  const radius = 6;

  return (
    <span
      title={title}
      aria-label={title}
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        width: size,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        {glyph === 'backlog' && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={tone}
            strokeWidth="1.6"
            strokeDasharray="2 2.1"
            fill="none"
          />
        )}
        {glyph === 'unstarted' && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={tone}
            strokeWidth="1.6"
            fill="none"
          />
        )}
        {(glyph === 'started' || glyph === 'review') && (
          <>
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={tone}
              strokeWidth="1.6"
              fill="none"
            />
            <path
              d={
                glyph === 'started'
                  ? 'M8 4a4 4 0 0 1 0 8z'
                  : 'M8 4a4 4 0 1 1-4 4h4z'
              }
              fill={tone}
            />
          </>
        )}
        {glyph === 'done' && (
          <>
            <circle cx={center} cy={center} r="7" fill={tone} />
            <path
              d="M5 8.2l2 2l4-4.2"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        )}
        {glyph === 'canceled' && (
          <>
            <circle cx={center} cy={center} r="7" fill={tone} />
            <path
              d="M5.5 5.5l5 5M10.5 5.5l-5 5"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </svg>
    </span>
  );
};
