// The role permission Twenty itself checks before a workspace view is created,
// edited or deleted ("Manage Views"). The board's column order is a view
// everyone on the project shares, so it is gated on this, not on an app grant.
export const MANAGE_VIEWS_PERMISSION_FLAG = 'VIEWS';
