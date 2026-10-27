import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  PRODUCT_BACKLOG_NAV_ITEM_UID,
  PRODUCT_BACKLOG_PAGE_LAYOUT_UID,
} from '../constants/product-backlog';
import { TASK_MANAGER_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: PRODUCT_BACKLOG_NAV_ITEM_UID,
  name: 'Product Backlog',
  icon: 'IconListDetails',
  color: 'blue',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: PRODUCT_BACKLOG_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: TASK_MANAGER_FOLDER_NAV_ITEM_UID,
});
