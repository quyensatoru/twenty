import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_SPECIAL_DAYS_VIEW_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
  SPECIAL_DAYS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SPECIAL_DAYS_NAV_ITEM_UID,
  name: 'Special Days',
  icon: 'IconCalendarStar',
  position: 6,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_SPECIAL_DAYS_VIEW_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
