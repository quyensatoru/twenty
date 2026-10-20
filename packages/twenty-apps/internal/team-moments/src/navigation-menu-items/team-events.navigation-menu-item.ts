import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_TEAM_EVENTS_VIEW_UID,
  MOMENTS_FOLDER_NAV_ITEM_UID,
  TEAM_EVENTS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TEAM_EVENTS_NAV_ITEM_UID,
  name: 'Team Events',
  icon: 'IconCalendarEvent',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_TEAM_EVENTS_VIEW_UID,
  folderUniversalIdentifier: MOMENTS_FOLDER_NAV_ITEM_UID,
});
