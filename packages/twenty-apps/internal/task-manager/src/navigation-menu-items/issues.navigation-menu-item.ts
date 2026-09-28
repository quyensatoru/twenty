import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  ISSUES_NAV_ITEM_UID,
  ALL_ISSUES_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ISSUES_NAV_ITEM_UID,
  name: 'Issues',
  icon: 'IconList',
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_ISSUES_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
