export const SIDE_COLUMN_MIN_WIDTH = 340;
export const SIDE_COLUMN_MAX_WIDTH = 640;

export const clampSideColumnWidth = (width: number): number =>
  Math.round(
    Math.min(SIDE_COLUMN_MAX_WIDTH, Math.max(SIDE_COLUMN_MIN_WIDTH, width)),
  );

// null is a column never resized, which keeps its responsive default rather
// than a fixed width. The store outlives every version of this value, so
// anything unreadable falls back to that default.
export const parseSideColumnWidth = (
  serialized: string | null,
): number | null => {
  if (serialized === null || serialized.trim() === '') {
    return null;
  }

  const width = Number(serialized);

  return Number.isFinite(width) ? clampSideColumnWidth(width) : null;
};
