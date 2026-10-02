import { TASK_TOKENS } from './task-tokens';

type TaskSkeletonBlockProps = {
  height: number | string;
  width?: number | string;
  isRound?: boolean;
  // Lets a placeholder take the same share of a flex column as the box it
  // stands in for, so the loaded panel keeps the geometry the skeleton had.
  shouldGrow?: boolean;
};

// An app cannot ship a stylesheet, so there are no keyframes and no shimmer: a
// placeholder is a flat block. What matters is that it occupies exactly the
// space the loaded content will, which is what stops the panel from resizing
// the moment the fetch lands.
export const TaskSkeletonBlock = ({
  height,
  width = '100%',
  isRound = false,
  shouldGrow = false,
}: TaskSkeletonBlockProps) => (
  <div
    aria-hidden
    style={{
      background: TASK_TOKENS.backgroundTertiary,
      borderRadius: isRound ? '50%' : TASK_TOKENS.radiusSmall,
      flexGrow: shouldGrow ? 1 : 0,
      flexShrink: 0,
      height,
      minHeight: 0,
      width,
    }}
  />
);
