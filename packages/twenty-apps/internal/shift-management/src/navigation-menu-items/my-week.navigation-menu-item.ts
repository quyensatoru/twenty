import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_WEEK_NAV_ITEM_UID,
  MY_WEEK_PAGE_LAYOUT_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_WEEK_NAV_ITEM_UID,
  name: 'My Week',
  icon: 'IconCalendarWeek',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: MY_WEEK_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
