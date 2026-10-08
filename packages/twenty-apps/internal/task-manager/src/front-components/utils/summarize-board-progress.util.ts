import { type BoardColumnPage } from '../../types/task-board';

// The board's "n / m done" line, from the server's column totals rather than
// the cards loaded so far.
export const summarizeBoardProgress = ({
  columnPages,
  columnKeys,
  doneStatusIds,
}: {
  columnPages: Record<string, BoardColumnPage>;
  columnKeys: readonly string[];
  doneStatusIds: ReadonlySet<string>;
}): { totalCount: number; doneCount: number; percent: number } => {
  const readTotal = (columnKey: string) =>
    columnPages[columnKey]?.totalCount ?? 0;
  const totalCount = columnKeys
    .map(readTotal)
    .reduce((sum, count) => sum + count, 0);
  const doneCount = [...doneStatusIds]
    .map(readTotal)
    .reduce((sum, count) => sum + count, 0);

  return {
    totalCount,
    doneCount,
    percent: totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100),
  };
};
