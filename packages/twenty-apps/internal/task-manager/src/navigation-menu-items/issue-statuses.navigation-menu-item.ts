import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  ISSUE_STATUSES_NAV_ITEM_UID,
  ALL_ISSUE_STATUSES_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ISSUE_STATUSES_NAV_ITEM_UID,
  name: 'Issue Statuses',
  icon: 'IconProgressCheck',
  position: 7,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_ISSUE_STATUSES_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
