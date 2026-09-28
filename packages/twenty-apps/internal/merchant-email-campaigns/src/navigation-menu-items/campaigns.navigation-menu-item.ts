import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_CAMPAIGNS_VIEW_UID,
  EMAIL_FOLDER_NAV_ITEM_UID,
  CAMPAIGNS_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CAMPAIGNS_NAV_ITEM_UID,
  name: 'Campaigns',
  icon: 'IconSpeakerphone',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_CAMPAIGNS_VIEW_UID,
  folderUniversalIdentifier: EMAIL_FOLDER_NAV_ITEM_UID,
});
