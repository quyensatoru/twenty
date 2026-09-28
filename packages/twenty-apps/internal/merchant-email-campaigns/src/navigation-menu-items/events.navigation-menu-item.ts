import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_EVENTS_VIEW_UID,
  EMAIL_FOLDER_NAV_ITEM_UID,
  EVENTS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: EVENTS_NAV_ITEM_UID,
  name: 'Event log',
  icon: 'IconBroadcast',
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_EVENTS_VIEW_UID,
  folderUniversalIdentifier: EMAIL_FOLDER_NAV_ITEM_UID,
});
