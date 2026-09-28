import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  APP_ACCESSES_NAV_ITEM_UID,
  ALL_APP_ACCESSES_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: APP_ACCESSES_NAV_ITEM_UID,
  name: 'App Accesses',
  icon: 'IconLock',
  position: 12,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_APP_ACCESSES_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
