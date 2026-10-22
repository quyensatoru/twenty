import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MOMENTS_FOLDER_NAV_ITEM_UID,
  POLLS_NAV_ITEM_UID,
  POLLS_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: POLLS_NAV_ITEM_UID,
  name: 'Polls',
  icon: 'IconChartBar',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: POLLS_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: MOMENTS_FOLDER_NAV_ITEM_UID,
});
