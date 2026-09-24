import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationMenuItemType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useIsMobile } from 'twenty-ui/utilities';
import {
  FeatureFlagKey,
  type NavigationMenuItem,
} from '~/generated-metadata/graphql';

import { currentNavigationMenuItemFolderIdState } from '@/navigation-menu-item/common/states/currentNavigationMenuItemFolderIdState';
import { lastClickedNavigationMenuItemIdState } from '@/navigation-menu-item/common/states/lastClickedNavigationMenuItemIdState';
import { openNavigationMenuItemFolderIdsState } from '@/navigation-menu-item/common/states/openNavigationMenuItemFolderIdsState';
import { useIdentifyActiveNavigationMenuItems } from '@/navigation-menu-item/display/hooks/useIdentifyActiveNavigationMenuItems';
import { getNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { lastVisitedViewPerObjectMetadataItemState } from '@/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';

type UseNavigationMenuItemFolderOpenStateParams = {
  folderId: string;
  folderChildrenNavigationMenuItems: NavigationMenuItem[];
};

export const useNavigationMenuItemFolderOpenState = ({
  folderId,
  folderChildrenNavigationMenuItems,
}: UseNavigationMenuItemFolderOpenStateParams) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );
  const isInitialObjectViewEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_INITIAL_OBJECT_VIEW_ENABLED,
  );

  const [openNavigationMenuItemFolderIds, setOpenNavigationMenuItemFolderIds] =
    useAtomState(openNavigationMenuItemFolderIdsState);
  const setCurrentNavigationMenuItemFolderId = useSetAtomState(
    currentNavigationMenuItemFolderIdState,
  );

  const { activeNavigationMenuItemIds } =
    useIdentifyActiveNavigationMenuItems();
  const setLastClickedNavigationMenuItemId = useSetAtomState(
    lastClickedNavigationMenuItemIdState,
  );

  const [isManuallyClosed, setIsManuallyClosed] = useState(false);

  const isExplicitlyOpen = openNavigationMenuItemFolderIds.includes(folderId);
  const activeChildIndex = folderChildrenNavigationMenuItems.findIndex((item) =>
    activeNavigationMenuItemIds.includes(item.id),
  );
  const hasActiveChild = activeChildIndex !== -1;
  const isOpen = isExplicitlyOpen || (hasActiveChild && !isManuallyClosed);

  const handleToggle = () => {
    if (isMobile) {
      setCurrentNavigationMenuItemFolderId((prev) =>
        prev === folderId ? null : folderId,
      );
    } else {
      setOpenNavigationMenuItemFolderIds((current) =>
        isOpen
          ? current.filter((id) => id !== folderId)
          : current.includes(folderId)
            ? current
            : [...current, folderId],
      );
      setIsManuallyClosed(isOpen);
    }

    if (!isOpen) {
      const firstNavigableItem = folderChildrenNavigationMenuItems.find(
        (item) => {
          const computedLink = getNavigationMenuItemComputedLink({
            item,
            objectMetadataItems,
            views,
            lastVisitedViewPerObjectMetadataItem,
            isInitialObjectViewEnabled,
          });

          // External links must not open on their own; in-app paths such as
          // /task route inside the app like object items do.
          if (item.type === NavigationMenuItemType.LINK) {
            return /^\/(?!\/)./.test(computedLink);
          }

          return isNonEmptyString(computedLink);
        },
      );
      if (isDefined(firstNavigableItem)) {
        const link = getNavigationMenuItemComputedLink({
          item: firstNavigableItem,
          objectMetadataItems,
          views,
          lastVisitedViewPerObjectMetadataItem,
          isInitialObjectViewEnabled,
        });
        if (isNonEmptyString(link)) {
          setLastClickedNavigationMenuItemId(firstNavigableItem.id);
          navigate(link);
        }
      }
    }
  };

  return {
    isOpen,
    handleToggle,
    hasActiveChild,
    activeChildIndex,
  };
};
