import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASKS_NAV_ITEM_UID,
  TASKS_PAGE_LAYOUT_UID,
  NAV_FOLDER_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TASKS_NAV_ITEM_UID,
  name: 'BC Tasks',
  icon: 'IconCheckbox',
  color: 'orange',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: TASKS_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: NAV_FOLDER_UID,
});
