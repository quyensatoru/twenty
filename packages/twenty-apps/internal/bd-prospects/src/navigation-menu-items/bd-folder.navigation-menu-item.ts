import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { BD_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: BD_FOLDER_NAV_ITEM_UID,
  name: 'BD Prospects',
  icon: 'IconTargetArrow',
  position: 0,
  type: NavigationMenuItemType.FOLDER,
});
