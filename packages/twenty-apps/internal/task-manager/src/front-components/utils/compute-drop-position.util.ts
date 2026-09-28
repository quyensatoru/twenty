// Where a record lands when dropped before `targetIndex` in a list. Positions
// stay fractional so a move only rewrites the record being moved, never the
// whole column — the same contract the host's own drag-to-reorder uses.
export const computeDropPosition = ({
  positions,
  targetIndex,
}: {
  positions: readonly number[];
  targetIndex: number;
}): number => {
  if (positions.length === 0) {
    return 1;
  }

  if (targetIndex <= 0) {
    return positions[0] - 1;
  }

  if (targetIndex >= positions.length) {
    return positions[positions.length - 1] + 1;
  }

  return (positions[targetIndex - 1] + positions[targetIndex]) / 2;
};
