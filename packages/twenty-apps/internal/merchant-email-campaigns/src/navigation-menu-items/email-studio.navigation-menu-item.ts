import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  EMAIL_FOLDER_NAV_ITEM_UID,
  EMAIL_STUDIO_NAV_ITEM_UID,
  EMAIL_STUDIO_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: EMAIL_STUDIO_NAV_ITEM_UID,
  name: 'Email Studio',
  icon: 'IconPalette',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: EMAIL_STUDIO_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: EMAIL_FOLDER_NAV_ITEM_UID,
});
