import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_SENDS_VIEW_UID,
  EMAIL_FOLDER_NAV_ITEM_UID,
  SENDS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SENDS_NAV_ITEM_UID,
  name: 'Send log',
  icon: 'IconMailForward',
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_SENDS_VIEW_UID,
  folderUniversalIdentifier: EMAIL_FOLDER_NAV_ITEM_UID,
});
