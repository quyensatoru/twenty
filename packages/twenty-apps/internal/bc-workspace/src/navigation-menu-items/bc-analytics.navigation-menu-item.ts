import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ANALYTICS_NAV_ITEM_UID,
  ANALYTICS_PAGE_LAYOUT_UID,
  NAV_FOLDER_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ANALYTICS_NAV_ITEM_UID,
  name: 'BC Analytics',
  icon: 'IconChartBar',
  color: 'green',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: ANALYTICS_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: NAV_FOLDER_UID,
});
