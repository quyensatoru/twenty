import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_MERCHANTS_VIEW_UID,
  CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
  MERCHANTS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MERCHANTS_NAV_ITEM_UID,
  name: 'Merchants',
  icon: 'IconBuildingStore',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_MERCHANTS_VIEW_UID,
  folderUniversalIdentifier: CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
});
