import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type TaskPriorityGlyphProps = {
  priority: string | null | undefined;
  size?: number;
  // Draws three faint dashes for "no priority", so a column of glyphs keeps
  // its rhythm instead of leaving a hole.
  shouldShowEmpty?: boolean;
};

// Jira's priority marks, so the board reads the way the team already knows:
// chevrons up for high, two bars for medium, chevrons down for low.
const PRIORITY_MARKS: Record<string, { paths: string[]; color: string }> = {
  HIGHEST: {
    paths: ['M3.5 8.5 8 4l4.5 4.5', 'M3.5 12.5 8 8l4.5 4.5'],
    color: readTagColor('red').text,
  },
  HIGH: { paths: ['M3.5 10.5 8 6l4.5 4.5'], color: readTagColor('red').text },
  MEDIUM: {
    paths: ['M3 6h10', 'M3 10h10'],
    color: readTagColor('orange').text,
  },
  LOW: { paths: ['M3.5 5.5 8 10l4.5-4.5'], color: readTagColor('blue').text },
  LOWEST: {
    paths: ['M3.5 3.5 8 8l4.5-4.5', 'M3.5 7.5 8 12l4.5-4.5'],
    color: readTagColor('blue').text,
  },
};

export const TaskPriorityGlyph = ({
  priority,
  size = 14,
  shouldShowEmpty = false,
}: TaskPriorityGlyphProps) => {
  const option = ISSUE_PRIORITY_OPTIONS.find(
    (candidate) => candidate.value === priority,
  );

  if (option === undefined && !shouldShowEmpty) {
    return null;
  }

  const label = option?.label;

  return (
    <span
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        width: size,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        {option === undefined ? (
          <path
            d="M3 8h2M7 8h2M11 8h2"
            stroke={TASK_TOKENS.textLight}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          (PRIORITY_MARKS[option.value]?.paths ?? []).map((path) => (
            <path
              key={path}
              d={path}
              stroke={PRIORITY_MARKS[option.value]?.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        )}
      </svg>
    </span>
  );
};
