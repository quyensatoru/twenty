import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { NAV_FOLDER_UID } from '../constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: NAV_FOLDER_UID,
  name: 'BC Workspace',
  icon: 'IconCrown',
  position: 21,
  type: NavigationMenuItemType.FOLDER,
});
