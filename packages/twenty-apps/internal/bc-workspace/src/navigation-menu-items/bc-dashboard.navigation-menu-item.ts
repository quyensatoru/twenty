import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  DASHBOARD_NAV_ITEM_UID,
  DASHBOARD_PAGE_LAYOUT_UID,
  NAV_FOLDER_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: DASHBOARD_NAV_ITEM_UID,
  name: 'BC Dashboard',
  icon: 'IconLayoutDashboard',
  color: 'blue',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: DASHBOARD_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: NAV_FOLDER_UID,
});
