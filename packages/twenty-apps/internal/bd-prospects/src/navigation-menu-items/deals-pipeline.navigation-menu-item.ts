import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  BD_FOLDER_NAV_ITEM_UID,
  DEALS_PIPELINE_NAV_ITEM_UID,
  DEALS_PIPELINE_VIEW_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: DEALS_PIPELINE_NAV_ITEM_UID,
  name: 'Upsell pipeline',
  icon: 'IconLayoutKanban',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: DEALS_PIPELINE_VIEW_UID,
  folderUniversalIdentifier: BD_FOLDER_NAV_ITEM_UID,
});
