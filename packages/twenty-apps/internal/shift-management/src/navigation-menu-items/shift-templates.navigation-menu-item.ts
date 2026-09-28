import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_SHIFT_TEMPLATES_VIEW_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
  SHIFT_TEMPLATES_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SHIFT_TEMPLATES_NAV_ITEM_UID,
  name: 'Shift Templates',
  icon: 'IconClockCog',
  position: 5,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
