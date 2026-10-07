// Issues a board column reads per round trip: about two screens of cards, so
// the first paint is cheap and the next page arrives before the reader
// scrolls into an empty column.
export const BOARD_COLUMN_PAGE_SIZE = 20;
