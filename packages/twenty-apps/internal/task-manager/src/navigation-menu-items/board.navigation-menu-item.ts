import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  BOARD_NAV_ITEM_UID,
  BOARD_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: BOARD_NAV_ITEM_UID,
  name: 'Board',
  icon: 'IconLayoutKanban',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: BOARD_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
