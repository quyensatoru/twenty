import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_BOARD_NAV_ITEM_UID,
  TASK_BOARD_PAGE_LAYOUT_UID,
  TASK_MANAGER_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

// Sits right under the legacy Board entry: that OBJECT entry resolves per
// person to their last opened view (usually a per-project Kanban the
// project.created trigger built), while this page is the Jira-style board
// with its issue drawer built in.
export default defineNavigationMenuItem({
  universalIdentifier: TASK_BOARD_NAV_ITEM_UID,
  name: 'Task Board',
  icon: 'IconLayoutKanban',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: TASK_BOARD_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
