import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  APPS_NAV_ITEM_UID,
  ALL_APPS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: APPS_NAV_ITEM_UID,
  name: 'Apps',
  icon: 'IconApps',
  position: 11,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_APPS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
