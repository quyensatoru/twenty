import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  WORKLOGS_NAV_ITEM_UID,
  ALL_WORKLOGS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: WORKLOGS_NAV_ITEM_UID,
  name: 'Worklogs',
  icon: 'IconClock',
  position: 9,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_WORKLOGS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
