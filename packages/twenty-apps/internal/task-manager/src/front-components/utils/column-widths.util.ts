export const COLUMN_DEFAULT_WIDTH = 272;
export const COLUMN_MIN_WIDTH = 200;
export const COLUMN_MAX_WIDTH = 640;

export const clampColumnWidth = (width: number): number =>
  Number.isFinite(width)
    ? Math.round(Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, width)))
    : COLUMN_DEFAULT_WIDTH;

// Widths are a per-reader view preference keyed by status id, kept in the
// sandbox's localStorage. Anything unreadable is dropped rather than trusted:
// the store outlives every version of this shape.
export const parseColumnWidths = (
  serialized: string | null,
): Record<string, number> => {
  if (serialized === null) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    return {};
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .map(([statusId, width]) => [statusId, clampColumnWidth(width)]),
  );
};
