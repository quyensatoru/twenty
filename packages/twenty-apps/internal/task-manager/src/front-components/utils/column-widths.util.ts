export const COLUMN_DEFAULT_WIDTH = 272;
export const COLUMN_MIN_WIDTH = 200;
export const COLUMN_MAX_WIDTH = 640;

export const clampColumnWidth = (width: number): number =>
  Number.isFinite(width)
    ? Math.round(Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, width)))
    : COLUMN_DEFAULT_WIDTH;

// One width for every column, a per-reader view preference kept in the
// sandbox's localStorage. Anything unreadable falls back to the default
// rather than being trusted: the store outlives every version of this value.
export const parseColumnWidth = (serialized: string | null): number => {
  if (serialized === null || serialized.trim() === '') {
    return COLUMN_DEFAULT_WIDTH;
  }

  return clampColumnWidth(Number(serialized));
};
