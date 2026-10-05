import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  BD_FOLDER_NAV_ITEM_UID,
  IMPORT_PAGE_LAYOUT_UID,
  IMPORT_PAGE_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: IMPORT_PAGE_NAV_ITEM_UID,
  name: 'Import prospects',
  icon: 'IconFileImport',
  position: 5,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: IMPORT_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: BD_FOLDER_NAV_ITEM_UID,
});
