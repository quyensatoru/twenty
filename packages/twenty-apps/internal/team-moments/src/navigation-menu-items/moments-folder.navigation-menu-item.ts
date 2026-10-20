import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { MOMENTS_FOLDER_NAV_ITEM_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MOMENTS_FOLDER_NAV_ITEM_UID,
  name: 'Team Moments',
  icon: 'IconConfetti',
  position: 2,
  type: NavigationMenuItemType.FOLDER,
});
