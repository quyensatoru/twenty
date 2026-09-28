import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ALL_TEMPLATES_VIEW_UID,
  EMAIL_FOLDER_NAV_ITEM_UID,
  TEMPLATES_NAV_ITEM_UID,
} from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TEMPLATES_NAV_ITEM_UID,
  name: 'Templates',
  icon: 'IconTemplate',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ALL_TEMPLATES_VIEW_UID,
  folderUniversalIdentifier: EMAIL_FOLDER_NAV_ITEM_UID,
});
