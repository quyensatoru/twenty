import { isDefined } from 'twenty-shared/utils';

import { toPre231RecordPageUniversalIdentifier } from 'src/database/commands/upgrade-version-command/2-10/utils/remap-record-page-universal-identifiers-to-pre-2-31.util';
import { type AllFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-maps.type';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type AllFlatEntityOperationByMetadataName } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-to-create-delete-update.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { type TwentyStandardAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/types/twenty-standard-all-flat-entity-maps.type';

type ForkStandardSyncMetadataName =
  | 'objectMetadata'
  | 'fieldMetadata'
  | 'index'
  | 'view'
  | 'viewField'
  | 'pageLayout'
  | 'pageLayoutTab'
  | 'pageLayoutWidget'
  | 'navigationMenuItem';

const FLAT_ENTITY_MAPS_KEY_BY_METADATA_NAME = {
  objectMetadata: 'flatObjectMetadataMaps',
  fieldMetadata: 'flatFieldMetadataMaps',
  index: 'flatIndexMaps',
  view: 'flatViewMaps',
  viewField: 'flatViewFieldMaps',
  pageLayout: 'flatPageLayoutMaps',
  pageLayoutTab: 'flatPageLayoutTabMaps',
  pageLayoutWidget: 'flatPageLayoutWidgetMaps',
  navigationMenuItem: 'flatNavigationMenuItemMaps',
} as const satisfies Record<
  ForkStandardSyncMetadataName,
  keyof TwentyStandardAllFlatEntityMaps
>;

type BuildForkStandardSyncOperationsArgs = {
  universalIdentifiersByMetadataName: Partial<
    Record<ForkStandardSyncMetadataName, string[]>
  >;
  // Commands registered before the 2-31 record-page reconcile must pass
  // computeTwentyStandardApplicationAllFlatEntityMapsPre231: record-page rows
  // are still stored under their literals at that point.
  standardAllFlatEntityMaps: TwentyStandardAllFlatEntityMaps;
  existingAllFlatEntityMaps: Partial<AllFlatEntityMaps>;
};

const getMissingStandardFlatEntitiesOrThrow = ({
  universalIdentifiers,
  standardFlatEntityMaps,
  existingFlatEntityMaps,
}: {
  universalIdentifiers: string[];
  standardFlatEntityMaps: FlatEntityMaps<SyncableFlatEntity>;
  existingFlatEntityMaps: FlatEntityMaps<SyncableFlatEntity> | undefined;
}): SyncableFlatEntity[] =>
  universalIdentifiers.flatMap((rawUniversalIdentifier) => {
    const universalIdentifier = toPre231RecordPageUniversalIdentifier(
      rawUniversalIdentifier,
    );

    if (
      isDefined(
        existingFlatEntityMaps?.byUniversalIdentifier[universalIdentifier],
      )
    ) {
      return [];
    }

    const standardFlatEntity =
      standardFlatEntityMaps.byUniversalIdentifier[universalIdentifier];

    if (!isDefined(standardFlatEntity)) {
      throw new Error(`Could not find standard entity ${universalIdentifier}`);
    }

    return [standardFlatEntity];
  });

// Commands registered before the 2-26 index-view reconcile can meet an object
// whose INDEX view still holds its pre-derivation literal: creating the
// derived one would duplicate the engine-reserved key, so it is skipped and
// the reconcile re-owns the existing row instead.
const dropViewsWhoseKeyIsAlreadyHeld = ({
  viewsToCreate,
  existingFlatViewMaps,
}: {
  viewsToCreate: FlatView[];
  existingFlatViewMaps: FlatEntityMaps<FlatView> | undefined;
}): FlatView[] => {
  const existingViews = Object.values(
    existingFlatViewMaps?.byUniversalIdentifier ?? {},
  ).filter(
    (flatView): flatView is FlatView =>
      isDefined(flatView) && !isDefined(flatView.deletedAt),
  );

  return viewsToCreate.filter(
    (viewToCreate) =>
      !isDefined(viewToCreate.key) ||
      !existingViews.some(
        (existingView) =>
          existingView.key === viewToCreate.key &&
          existingView.objectMetadataUniversalIdentifier ===
            viewToCreate.objectMetadataUniversalIdentifier,
      ),
  );
};

export const buildForkStandardSyncOperations = ({
  universalIdentifiersByMetadataName,
  standardAllFlatEntityMaps,
  existingAllFlatEntityMaps,
}: BuildForkStandardSyncOperationsArgs): {
  allFlatEntityOperationByMetadataName: AllFlatEntityOperationByMetadataName;
  totalOperationCount: number;
} => {
  const flatEntitiesToCreateByMetadataName: Partial<
    Record<ForkStandardSyncMetadataName, SyncableFlatEntity[]>
  > = {};

  for (const [metadataName, universalIdentifiers] of Object.entries(
    universalIdentifiersByMetadataName,
  ) as [ForkStandardSyncMetadataName, string[]][]) {
    const flatEntityMapsKey =
      FLAT_ENTITY_MAPS_KEY_BY_METADATA_NAME[metadataName];

    flatEntitiesToCreateByMetadataName[metadataName] =
      getMissingStandardFlatEntitiesOrThrow({
        universalIdentifiers,
        standardFlatEntityMaps: standardAllFlatEntityMaps[
          flatEntityMapsKey
        ] as FlatEntityMaps<SyncableFlatEntity>,
        existingFlatEntityMaps: existingAllFlatEntityMaps[flatEntityMapsKey] as
          | FlatEntityMaps<SyncableFlatEntity>
          | undefined,
      });
  }

  if (isDefined(flatEntitiesToCreateByMetadataName.view)) {
    flatEntitiesToCreateByMetadataName.view = dropViewsWhoseKeyIsAlreadyHeld({
      viewsToCreate: flatEntitiesToCreateByMetadataName.view as FlatView[],
      existingFlatViewMaps: existingAllFlatEntityMaps.flatViewMaps,
    });
  }

  if (isDefined(flatEntitiesToCreateByMetadataName.viewField)) {
    const reachableViewUniversalIdentifiers = new Set([
      ...Object.keys(
        existingAllFlatEntityMaps.flatViewMaps?.byUniversalIdentifier ?? {},
      ),
      ...(flatEntitiesToCreateByMetadataName.view ?? []).map(
        (flatView) => flatView.universalIdentifier,
      ),
    ]);

    flatEntitiesToCreateByMetadataName.viewField = (
      flatEntitiesToCreateByMetadataName.viewField as FlatViewField[]
    ).filter((flatViewField) =>
      reachableViewUniversalIdentifiers.has(
        flatViewField.viewUniversalIdentifier,
      ),
    );
  }

  const allFlatEntityOperationByMetadataName = Object.fromEntries(
    Object.entries(flatEntitiesToCreateByMetadataName).map(
      ([metadataName, flatEntityToCreate]) => [
        metadataName,
        { flatEntityToCreate, flatEntityToDelete: [], flatEntityToUpdate: [] },
      ],
    ),
  ) as AllFlatEntityOperationByMetadataName;

  const totalOperationCount = Object.values(
    flatEntitiesToCreateByMetadataName,
  ).reduce(
    (total, flatEntitiesToCreate) => total + (flatEntitiesToCreate ?? []).length,
    0,
  );

  return { allFlatEntityOperationByMetadataName, totalOperationCount };
};
