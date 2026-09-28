import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  PROJECTS_NAV_ITEM_UID,
  ALL_PROJECTS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: PROJECTS_NAV_ITEM_UID,
  name: 'Projects',
  icon: 'IconListDetails',
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_PROJECTS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
