import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ANALYTICS_NAV_ITEM_UID,
  ANALYTICS_PAGE_LAYOUT_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ANALYTICS_NAV_ITEM_UID,
  name: 'Analytics',
  icon: 'IconChartBar',
  position: 3,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: ANALYTICS_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
