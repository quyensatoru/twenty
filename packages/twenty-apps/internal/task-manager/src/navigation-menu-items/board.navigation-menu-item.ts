import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  BOARD_NAV_ITEM_UID,
  ISSUE_OBJECT_UID,
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

// OBJECT, not VIEW, and that is the whole point: a VIEW entry pins everybody to
// the same board, while every usable board here is per-project — filtered to
// one project and its app, which is also what seeds a new card so the
// row-level predicate accepts the write. There is no workspace-wide board on
// purpose: without a project and app filter a new card arrives with neither
// and creation fails.
//
// An OBJECT entry resolves its target per person from the last view that
// member opened, falling back to the engine INDEX view (or to the first
// non-index view, a project board at position 0, when
// IS_INITIAL_OBJECT_VIEW_ENABLED is on). Twenty has no per-member default
// view beyond this; the memory lives in the browser, not on the server.
export default defineNavigationMenuItem({
  universalIdentifier: BOARD_NAV_ITEM_UID,
  name: 'Board',
  icon: 'IconLayoutKanban',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: ISSUE_OBJECT_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
