import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MOMENTS_FOLDER_NAV_ITEM_UID,
  MOMENTS_NAV_ITEM_UID,
  MOMENTS_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MOMENTS_NAV_ITEM_UID,
  name: 'Moments',
  icon: 'IconStar',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: MOMENTS_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: MOMENTS_FOLDER_NAV_ITEM_UID,
});
