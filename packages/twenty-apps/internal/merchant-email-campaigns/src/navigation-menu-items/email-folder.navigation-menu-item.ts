import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { EMAIL_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: EMAIL_FOLDER_NAV_ITEM_UID,
  name: 'Email Marketing',
  icon: 'IconMailbox',
  position: 1,
  type: NavigationMenuItemType.FOLDER,
});
