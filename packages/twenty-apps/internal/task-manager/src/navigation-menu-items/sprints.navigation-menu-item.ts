import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  SPRINTS_NAV_ITEM_UID,
  ALL_SPRINTS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SPRINTS_NAV_ITEM_UID,
  name: 'Sprints',
  icon: 'IconRun',
  position: 5,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_SPRINTS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
