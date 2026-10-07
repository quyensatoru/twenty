import { IconChevronDown, IconChevronUp, IconMinus } from 'twenty-ui/icon';

import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { readTagColor } from './task-tokens';

type TaskPriorityGlyphProps = {
  priority: string | null | undefined;
  size?: number;
};

// Jira's priority marks: stacked chevrons up for the urgent end, an equals
// sign for medium, chevrons down for the low end. Stacking two glyphs is the
// only way to draw them — twenty-ui exports no double-chevron icon.
const GLYPH_BY_PRIORITY = {
  HIGHEST: { Icon: IconChevronUp, isDoubled: true },
  HIGH: { Icon: IconChevronUp, isDoubled: false },
  MEDIUM: { Icon: IconMinus, isDoubled: true },
  LOW: { Icon: IconChevronDown, isDoubled: false },
  LOWEST: { Icon: IconChevronDown, isDoubled: true },
} as const;

export const TaskPriorityGlyph = ({
  priority,
  size = 16,
}: TaskPriorityGlyphProps) => {
  const option = ISSUE_PRIORITY_OPTIONS.find(
    (candidate) => candidate.value === priority,
  );

  if (option === undefined) {
    return null;
  }

  const { Icon, isDoubled } = GLYPH_BY_PRIORITY[option.value];
  const color = readTagColor(option.color).text;
  const offset = Math.round(size * 0.18);

  return (
    <span
      title={option.label}
      aria-label={option.label}
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        position: 'relative',
        width: size,
      }}
    >
      {isDoubled ? (
        <>
          <span style={{ display: 'inline-flex', left: 0, position: 'absolute', top: -offset }}>
            <Icon size={size} color={color} stroke={2.5} />
          </span>
          <span style={{ display: 'inline-flex', left: 0, position: 'absolute', top: offset }}>
            <Icon size={size} color={color} stroke={2.5} />
          </span>
        </>
      ) : (
        <Icon size={size} color={color} stroke={2.5} />
      )}
    </span>
  );
};
