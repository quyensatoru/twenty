import { type BoardColumnPage } from '../../types/task-board';

// The board's "n / m done" line and the sprint strip's segmented bar, from the
// server's column totals rather than the cards loaded so far.
export const summarizeBoardProgress = ({
  columnPages,
  columnKeys,
  doneStatusIds,
  startedStatusIds = new Set<string>(),
}: {
  columnPages: Record<string, BoardColumnPage>;
  columnKeys: readonly string[];
  doneStatusIds: ReadonlySet<string>;
  startedStatusIds?: ReadonlySet<string>;
}): {
  totalCount: number;
  doneCount: number;
  startedCount: number;
  percent: number;
} => {
  const readTotal = (columnKey: string) =>
    columnPages[columnKey]?.totalCount ?? 0;
  const totalCount = columnKeys
    .map(readTotal)
    .reduce((sum, count) => sum + count, 0);
  const doneCount = [...doneStatusIds]
    .map(readTotal)
    .reduce((sum, count) => sum + count, 0);

  const startedCount = [...startedStatusIds]
    .map(readTotal)
    .reduce((sum, count) => sum + count, 0);

  return {
    totalCount,
    doneCount,
    startedCount,
    percent: totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100),
  };
};
