import { Injectable } from '@nestjs/common';

import { ViewKey, ViewType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import {
  type BuildSideEffectsArgs,
  MetadataSideEffectHandler,
} from 'src/engine/metadata-modules/metadata-side-effect/interfaces/base-metadata-side-effect-handler.service';
import { type MetadataSideEffectResult } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-result.type';
import { buildReservedSystemFlatFieldMetadatasForCustomObject } from 'src/engine/metadata-modules/object-metadata/utils/build-reserved-system-flat-field-metadatas-for-custom-object.util';
import { computeFlatViewFieldsToCreate } from 'src/engine/metadata-modules/object-metadata/utils/compute-flat-view-fields-to-create.util';
import { type UniversalFlatFieldMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-field-metadata.type';
import { type UniversalFlatView } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-view.type';

@Injectable()
export class ObjectDefaultViewFieldsOnCreateSideEffectHandlerService extends MetadataSideEffectHandler(
  {
    operation: 'create',
    metadataName: 'objectMetadata',
    name: 'objectDefaultViewFieldsOnCreate',
    description:
      'When an object is created, generate default view fields for its default index and record-page fields views from caller-provided object fields plus reserved system fields.',
  },
) {
  buildSideEffects({
    flatEntity: flatObjectMetadata,
    allFlatEntityOperationRecordByMetadataName,
  }: BuildSideEffectsArgs<'objectMetadata'>): MetadataSideEffectResult {
    const pendingDefaultViews = Object.values(
      allFlatEntityOperationRecordByMetadataName.view?.flatEntityToCreate ?? {},
    )
      .filter(isDefined)
      .filter(
        (flatView) =>
          flatView.objectMetadataUniversalIdentifier ===
          flatObjectMetadata.universalIdentifier,
      )
      .filter(
        (flatView) =>
          this.isDefaultView(flatView) &&
          !this.hasPendingViewFields({
            flatView,
            allFlatEntityOperationRecordByMetadataName,
          }),
      );

    if (pendingDefaultViews.length === 0) {
      return { status: 'noop' };
    }

    const objectFlatFieldMetadatas =
      this.computeObjectFlatFieldMetadatasForViewFields({
        flatObjectMetadata,
        allFlatEntityOperationRecordByMetadataName,
      });
    const flatViewFieldToCreateByUniversalIdentifier: Record<
      string,
      MetadataUniversalFlatEntity<'viewField'>
    > = {};

    for (const pendingDefaultView of pendingDefaultViews) {
      const flatViewFieldsToCreate = computeFlatViewFieldsToCreate({
        flatApplication: {
          universalIdentifier:
            flatObjectMetadata.applicationUniversalIdentifier,
        },
        objectFlatFieldMetadatas,
        labelIdentifierFieldMetadataUniversalIdentifier:
          flatObjectMetadata.labelIdentifierFieldMetadataUniversalIdentifier,
        viewUniversalIdentifier: pendingDefaultView.universalIdentifier,
        excludeLabelIdentifier:
          pendingDefaultView.type === ViewType.FIELDS_WIDGET,
      });

      for (const flatViewFieldToCreate of flatViewFieldsToCreate) {
        flatViewFieldToCreateByUniversalIdentifier[
          flatViewFieldToCreate.universalIdentifier
        ] = flatViewFieldToCreate;
      }
    }

    if (Object.keys(flatViewFieldToCreateByUniversalIdentifier).length === 0) {
      return { status: 'noop' };
    }

    return {
      status: 'success',
      operations: {
        viewField: {
          flatEntityToCreate: flatViewFieldToCreateByUniversalIdentifier,
        },
      },
    };
  }

  private computeObjectFlatFieldMetadatasForViewFields({
    flatObjectMetadata,
    allFlatEntityOperationRecordByMetadataName,
  }: Pick<
    BuildSideEffectsArgs<'objectMetadata'>,
    'allFlatEntityOperationRecordByMetadataName'
  > & {
    flatObjectMetadata: BuildSideEffectsArgs<'objectMetadata'>['flatEntity'];
  }): UniversalFlatFieldMetadata[] {
    const callerProvidedFlatFieldMetadatas = Object.values(
      allFlatEntityOperationRecordByMetadataName.fieldMetadata
        ?.flatEntityToCreate ?? {},
    )
      .filter(isDefined)
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.objectMetadataUniversalIdentifier ===
            flatObjectMetadata.universalIdentifier &&
          flatFieldMetadata.isSystemSideEffect !== true,
      );

    return [
      ...callerProvidedFlatFieldMetadatas,
      ...Object.values(
        buildReservedSystemFlatFieldMetadatasForCustomObject({
          flatObjectMetadata: {
            applicationUniversalIdentifier:
              flatObjectMetadata.applicationUniversalIdentifier,
            universalIdentifier: flatObjectMetadata.universalIdentifier,
          },
        }),
      ),
    ];
  }

  private hasPendingViewFields({
    flatView,
    allFlatEntityOperationRecordByMetadataName,
  }: {
    flatView: UniversalFlatView;
    allFlatEntityOperationRecordByMetadataName: BuildSideEffectsArgs<'objectMetadata'>['allFlatEntityOperationRecordByMetadataName'];
  }): boolean {
    return Object.values(
      allFlatEntityOperationRecordByMetadataName.viewField
        ?.flatEntityToCreate ?? {},
    )
      .filter(isDefined)
      .some(
        (flatViewField) =>
          flatViewField.viewUniversalIdentifier ===
          flatView.universalIdentifier,
      );
  }

  private isDefaultView(flatView: UniversalFlatView): boolean {
    return (
      flatView.key === ViewKey.INDEX || flatView.type === ViewType.FIELDS_WIDGET
    );
  }
}
