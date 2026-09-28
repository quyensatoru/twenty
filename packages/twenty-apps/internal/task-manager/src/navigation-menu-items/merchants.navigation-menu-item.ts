import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  MERCHANTS_NAV_ITEM_UID,
  ALL_MERCHANTS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MERCHANTS_NAV_ITEM_UID,
  name: 'Merchants',
  icon: 'IconBuildingStore',
  position: 10,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_MERCHANTS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
