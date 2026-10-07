import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_BOARD_NAV_ITEM_UID,
  TASK_BOARD_PAGE_LAYOUT_UID,
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

// The only board entry: the legacy OBJECT entry that resolved per person to
// their last opened per-project Kanban is gone, those views stay reachable
// from the issue object.
export default defineNavigationMenuItem({
  universalIdentifier: TASK_BOARD_NAV_ITEM_UID,
  name: 'Board',
  icon: 'IconLayoutKanban',
  color: 'red',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: TASK_BOARD_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
