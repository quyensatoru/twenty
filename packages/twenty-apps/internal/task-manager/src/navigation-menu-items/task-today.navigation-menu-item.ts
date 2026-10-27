import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_TODAY_NAV_ITEM_UID,
  TASK_TODAY_PAGE_LAYOUT_UID,
} from '../constants/task-today';
import { TASK_MANAGER_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TASK_TODAY_NAV_ITEM_UID,
  name: 'Today',
  icon: 'IconLayoutDashboard',
  color: 'blue',
  position: 3,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: TASK_TODAY_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
