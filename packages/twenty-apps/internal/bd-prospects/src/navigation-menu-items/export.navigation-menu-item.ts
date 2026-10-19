import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  BD_FOLDER_NAV_ITEM_UID,
  EXPORT_PAGE_LAYOUT_UID,
  EXPORT_PAGE_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: EXPORT_PAGE_NAV_ITEM_UID,
  name: 'Export prospects',
  icon: 'IconFileExport',
  position: 6,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: EXPORT_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: BD_FOLDER_NAV_ITEM_UID,
});
