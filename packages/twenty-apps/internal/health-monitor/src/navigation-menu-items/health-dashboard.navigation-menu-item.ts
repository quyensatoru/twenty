import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  HEALTH_DASHBOARD_NAV_ITEM_UID,
  HEALTH_DASHBOARD_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: HEALTH_DASHBOARD_NAV_ITEM_UID,
  name: 'Health Monitor',
  icon: 'IconHeartRateMonitor',
  position: 3,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: HEALTH_DASHBOARD_PAGE_LAYOUT_UID,
});
