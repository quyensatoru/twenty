import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  ISSUE_COMMENTS_NAV_ITEM_UID,
  ALL_ISSUE_COMMENTS_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ISSUE_COMMENTS_NAV_ITEM_UID,
  name: 'Issue Comments',
  icon: 'IconMessage',
  position: 8,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_ISSUE_COMMENTS_VIEW_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
