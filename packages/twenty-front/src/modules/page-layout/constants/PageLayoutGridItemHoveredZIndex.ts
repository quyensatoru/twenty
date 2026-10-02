// A widget whose content overflows its card — an app's own dropdown, say — is
// painted inside the grid item's stacking context, so without this it sits
// under whichever widget comes after it. Same value the dragged item uses: the
// pointer is over one widget at a time, so raising that one cannot hide
// anything the reader is looking at.
export const PAGE_LAYOUT_GRID_ITEM_HOVERED_Z_INDEX = 3;
