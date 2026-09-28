import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { SHIFT_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

// The fork put My Week / Register / Report / Analytics behind an in-page tab bar
// (ShiftTopBar). The app makes each one a page layout and this folder is the tab
// bar: same four destinations, same labels, rendered by the host sidebar.
export default defineNavigationMenuItem({
  universalIdentifier: SHIFT_FOLDER_NAV_ITEM_UID,
  name: 'Shifts',
  icon: 'IconCalendarClock',
  position: 1,
  type: NavigationMenuItemType.FOLDER,
});
