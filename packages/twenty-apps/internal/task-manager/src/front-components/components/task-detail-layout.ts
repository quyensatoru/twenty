// Column measures of the issue detail, shared by the loaded view and its
// skeleton so the two never drift apart. CSS rather than measured widths: the
// worker has no window to read.

// The modal's right column: the sidebar's 340 on a modest screen, growing to
// 480 once the issue has its 900 (an 820 text column and padding) to spare, so
// a wide screen buys a roomier sidebar rather than a third column. A preview
// drawer takes exactly this column, so opening one never lands on the issue.
export const MODAL_SIDE_COLUMN_WIDTH =
  'clamp(340px, calc(100% - 900px), 480px)';

// The record page's side column grows with the page up to the modal's 480,
// never under 360. Beside an issue column of at least 520; below that (a side
// panel, a phone) it wraps under the issue.
export const PAGE_SIDE_COLUMN_MIN_WIDTH = 360;
export const PAGE_SIDE_COLUMN_WIDTH = `clamp(${PAGE_SIDE_COLUMN_MIN_WIDTH}px, 30%, 480px)`;
export const PAGE_ISSUE_COLUMN_MIN_WIDTH = 520;

// The modal's issue column keeps this much however wide its properties are
// dragged.
const MODAL_ISSUE_COLUMN_MIN_WIDTH = 560;

// A dragged width replaces the responsive default, still capped by the room
// the issue column needs, so a width stored on a wide screen cannot crush the
// issue on a narrow one.
export const readModalSideColumnWidth = (width: number | null) =>
  width === null
    ? MODAL_SIDE_COLUMN_WIDTH
    : `max(340px, min(${width}px, calc(100% - ${MODAL_ISSUE_COLUMN_MIN_WIDTH}px)))`;

export const readPageSideColumnWidth = (width: number | null) =>
  width === null
    ? PAGE_SIDE_COLUMN_WIDTH
    : `max(${PAGE_SIDE_COLUMN_MIN_WIDTH}px, min(${width}px, calc(100% - ${PAGE_ISSUE_COLUMN_MIN_WIDTH}px)))`;

// The modal's header row and the issue column's padding.
export const DETAIL_HEADER_HEIGHT = 48;
export const DETAIL_MAIN_PADDING = '24px 32px 40px 32px';
export const DETAIL_PAGE_MAIN_PADDING = '24px 32px 48px 32px';
export const DETAIL_SIDE_PADDING = '16px 12px';
