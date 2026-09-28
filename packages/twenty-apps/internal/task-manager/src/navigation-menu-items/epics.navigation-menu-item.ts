import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  EPICS_NAV_ITEM_UID,
  ALL_EPICS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: EPICS_NAV_ITEM_UID,
  name: 'Epics',
  icon: 'IconStack2',
  position: 6,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_EPICS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
