export const COLUMN_DEFAULT_WIDTH = 272;
export const COLUMN_MIN_WIDTH = 200;
export const COLUMN_MAX_WIDTH = 640;
export const COLLAPSED_COLUMN_WIDTH = 44;

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

// Every column shares one width, empty or not, so the board keeps one rhythm
// and nothing shifts when a column gets its first card. Only a column the
// reader collapsed by hand is narrower.
export type BoardColumnLayout = 'normal' | 'collapsed';

export const readBoardColumnLayout = ({
  isCollapsed,
}: {
  isCollapsed: boolean;
}): BoardColumnLayout => (isCollapsed ? 'collapsed' : 'normal');

export const readBoardColumnWidth = (
  layout: BoardColumnLayout,
  columnWidth: number,
): number => (layout === 'collapsed' ? COLLAPSED_COLUMN_WIDTH : columnWidth);

// Only normal columns share the resizable width, so the held edge moves by
// the change times the normal columns up to and including the held one; the
// collapsed ones before it keep their fixed width.
export const readResizedColumnWidth = ({
  startWidth,
  deltaX,
  resizableColumnCountThroughHeld,
}: {
  startWidth: number;
  deltaX: number;
  resizableColumnCountThroughHeld: number;
}): number =>
  clampColumnWidth(
    startWidth + deltaX / Math.max(1, resizableColumnCountThroughHeld),
  );

export const parseIsColumnCollapsed = (serialized: string | null): boolean =>
  serialized === 'true';
