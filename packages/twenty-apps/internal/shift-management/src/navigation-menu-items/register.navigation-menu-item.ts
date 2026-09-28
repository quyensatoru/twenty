import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  REGISTER_NAV_ITEM_UID,
  REGISTER_PAGE_LAYOUT_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: REGISTER_NAV_ITEM_UID,
  name: 'Register',
  icon: 'IconCalendarPlus',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: REGISTER_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
