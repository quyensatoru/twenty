import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_PROSPECTS_NAV_ITEM_UID,
  ALL_PROSPECTS_VIEW_UID,
  BD_FOLDER_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ALL_PROSPECTS_NAV_ITEM_UID,
  name: 'High-Value Prospects',
  icon: 'IconTargetArrow',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_PROSPECTS_VIEW_UID,
  folderUniversalIdentifier: BD_FOLDER_NAV_ITEM_UID,
});
