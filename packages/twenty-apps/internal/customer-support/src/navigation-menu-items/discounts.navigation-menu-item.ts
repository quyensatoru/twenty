import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
  DISCOUNTS_NAV_ITEM_UID,
  DISCOUNTS_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: DISCOUNTS_NAV_ITEM_UID,
  name: 'Discounts',
  icon: 'IconDiscount',
  color: 'iris',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: DISCOUNTS_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
});
