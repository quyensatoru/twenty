import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  REPORT_NAV_ITEM_UID,
  REPORT_PAGE_LAYOUT_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: REPORT_NAV_ITEM_UID,
  name: 'Report',
  icon: 'IconReportAnalytics',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: REPORT_PAGE_LAYOUT_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
