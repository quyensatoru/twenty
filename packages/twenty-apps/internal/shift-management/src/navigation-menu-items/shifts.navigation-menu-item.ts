import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_SHIFTS_VIEW_UID,
  SHIFT_FOLDER_NAV_ITEM_UID,
  SHIFTS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

// The host record index the fork reached at /objects/shifts. Only Leader/PO see
// rows here once the workspace Member role loses read on shift (see DEPLOY.md).
export default defineNavigationMenuItem({
  universalIdentifier: SHIFTS_NAV_ITEM_UID,
  name: 'All Shifts',
  icon: 'IconCalendarClock',
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_SHIFTS_VIEW_UID,
  folderUniversalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
});
