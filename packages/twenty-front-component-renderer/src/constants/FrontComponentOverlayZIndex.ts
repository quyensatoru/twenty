// Matches twenty-front's RootStackingContextZIndices.DropdownPortalBelowModal,
// so an overlay opened by a front component stacks exactly like one of the
// embedder's own dropdowns: above the page, below a modal. The value is copied
// rather than imported because twenty-front depends on this package, never the
// other way round.
export const FRONT_COMPONENT_OVERLAY_Z_INDEX = 38;
