import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { isNonEmptyString } from '@sniptt/guards';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

// The object's plural label, unless the entry was given a name of its own.
// An entry that opens the issue object as a board is called "Board" there and
// "Issues" everywhere else, and renaming the object to say so would rename it
// on every record page, picker and search result too.
export const getObjectNavigationMenuItemLabel = (
  item: Pick<NavigationMenuItem, 'targetObjectMetadataId' | 'name'>,
  objectMetadataItems: Pick<EnrichedObjectMetadataItem, 'id' | 'labelPlural'>[],
): string => {
  const ownName = item.name?.trim();

  if (isNonEmptyString(ownName)) {
    return ownName;
  }

  const objectMetadataItem = objectMetadataItems.find(
    (meta) => meta.id === item.targetObjectMetadataId,
  );
  return objectMetadataItem?.labelPlural ?? '';
};
