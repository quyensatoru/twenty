import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { TASK_MANAGER_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
  name: 'Task Manager',
  icon: 'IconLayoutKanban',
  position: 1,
  type: NavigationMenuItemType.FOLDER,
});
