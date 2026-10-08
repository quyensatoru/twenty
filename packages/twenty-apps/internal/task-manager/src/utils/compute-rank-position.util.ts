export type RankSide = 'after' | 'before';

// An issue dropped against another lands halfway to that issue's neighbour on
// the drop side. At a section's edge there is no neighbour, and one whole step
// leaves a gap the next drop can split again.
export const computeRankPosition = ({
  anchorPosition,
  neighborPosition,
  side,
}: {
  anchorPosition: number;
  neighborPosition: number | null;
  side: RankSide;
}): number => {
  if (neighborPosition === null) {
    return side === 'after' ? anchorPosition + 1 : anchorPosition - 1;
  }

  return (anchorPosition + neighborPosition) / 2;
};
