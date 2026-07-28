import { type FlatNavigationMenuItem } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item.type';
import { NavigationMenuItemType } from 'src/engine/metadata-modules/navigation-menu-item/enums/navigation-menu-item-type.enum';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';

export const createStandardNavigationMenuItemLinkFlatMetadata = ({
  universalIdentifier,
  name,
  link,
  icon,
  color,
  position,
  navigationMenuItemId,
  workspaceId,
  twentyStandardApplicationId,
  now,
}: {
  universalIdentifier: string;
  name: string;
  link: string;
  icon?: string | null;
  color?: string | null;
  position: number;
  navigationMenuItemId: string;
  workspaceId: string;
  twentyStandardApplicationId: string;
  now: string;
}): FlatNavigationMenuItem => ({
  id: navigationMenuItemId,
  type: NavigationMenuItemType.LINK,
  universalIdentifier,
  applicationId: twentyStandardApplicationId,
  applicationUniversalIdentifier:
    TWENTY_STANDARD_APPLICATION.universalIdentifier,
  workspaceId,
  userWorkspaceId: null,
  targetRecordId: null,
  targetObjectMetadataId: null,
  targetObjectMetadataUniversalIdentifier: null,
  viewId: null,
  viewUniversalIdentifier: null,
  folderId: null,
  folderUniversalIdentifier: null,
  pageLayoutId: null,
  pageLayoutUniversalIdentifier: null,
  name,
  link,
  icon: icon ?? null,
  color: color ?? null,
  position,
  createdAt: now,
  updatedAt: now,
});
