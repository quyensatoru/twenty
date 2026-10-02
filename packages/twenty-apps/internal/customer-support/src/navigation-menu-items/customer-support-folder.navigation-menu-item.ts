import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID,
  name: 'Customer Support',
  icon: 'IconBuildingStore',
  position: 20,
  type: NavigationMenuItemType.FOLDER,
});
