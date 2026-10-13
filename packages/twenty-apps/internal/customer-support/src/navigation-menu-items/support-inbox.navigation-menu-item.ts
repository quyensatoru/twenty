import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
  SUPPORT_INBOX_NAV_ITEM_UID,
  SUPPORT_INBOX_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SUPPORT_INBOX_NAV_ITEM_UID,
  name: 'Support inbox',
  icon: 'IconMessage',
  color: 'blue',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: SUPPORT_INBOX_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
});
