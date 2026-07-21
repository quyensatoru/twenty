import { getFieldUniversalIdentifier } from 'twenty-shared/application';
import { FieldMetadataType, ViewKey, ViewType } from 'twenty-shared/types';

import { type AllFlatEntityOperationRecordByMetadataName } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-operation-record-by-metadata-name.type';
import { type BuildSideEffectsArgs } from 'src/engine/metadata-modules/metadata-side-effect/interfaces/base-metadata-side-effect-handler.service';
import { ObjectDefaultViewFieldsOnCreateSideEffectHandlerService } from 'src/engine/metadata-modules/metadata-side-effect/handlers/object-metadata/services/object-default-view-fields-on-create-side-effect-handler.service';
import { type UniversalFlatFieldMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-field-metadata.type';
import { type UniversalFlatViewField } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-view-field.type';
import { type UniversalFlatView } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-view.type';

const APPLICATION_UNIVERSAL_IDENTIFIER = 'a1a2a3a4-a5a6-4000-8000-000000000001';
const OBJECT_UNIVERSAL_IDENTIFIER = 'b1b2b3b4-b5b6-4000-8000-000000000001';
const INDEX_VIEW_UNIVERSAL_IDENTIFIER = 'c1c2c3c4-c5c6-4000-8000-000000000001';
const FIELDS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER =
  'd1d2d3d4-d5d6-4000-8000-000000000001';

const getFieldUniversalIdentifierByName = (name: string) =>
  getFieldUniversalIdentifier({
    applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
    objectUniversalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
    name,
  });

const NAME_FIELD_UNIVERSAL_IDENTIFIER =
  getFieldUniversalIdentifierByName('name');

const FIELD_UNIVERSAL_IDENTIFIERS_VISIBLE_BY_DEFAULT = [
  'name',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
].map(getFieldUniversalIdentifierByName);

const FIELD_WIDGET_FIELD_UNIVERSAL_IDENTIFIERS_VISIBLE_BY_DEFAULT =
  FIELD_UNIVERSAL_IDENTIFIERS_VISIBLE_BY_DEFAULT.filter(
    (fieldUniversalIdentifier) =>
      fieldUniversalIdentifier !== NAME_FIELD_UNIVERSAL_IDENTIFIER,
  );

const toRecordByUniversalIdentifier = <
  T extends { universalIdentifier: string },
>(
  items: T[],
) =>
  Object.fromEntries(
    items.map((item) => [item.universalIdentifier, item]),
  ) as Record<string, T>;

const buildField = ({
  name,
  type = FieldMetadataType.TEXT,
  isSystemSideEffect = false,
}: {
  name: string;
  type?: FieldMetadataType;
  isSystemSideEffect?: boolean;
}): UniversalFlatFieldMetadata =>
  ({
    universalIdentifier: getFieldUniversalIdentifierByName(name),
    objectMetadataUniversalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
    name,
    type,
    isSystemSideEffect,
  }) as unknown as UniversalFlatFieldMetadata;

const buildView = ({
  universalIdentifier,
  key,
  type,
}: {
  universalIdentifier: string;
  key: ViewKey | null;
  type: ViewType;
}): UniversalFlatView =>
  ({
    universalIdentifier,
    objectMetadataUniversalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
    key,
    type,
  }) as unknown as UniversalFlatView;

const buildViewField = ({
  universalIdentifier,
  viewUniversalIdentifier,
}: {
  universalIdentifier: string;
  viewUniversalIdentifier: string;
}): UniversalFlatViewField =>
  ({
    universalIdentifier,
    viewUniversalIdentifier,
  }) as unknown as UniversalFlatViewField;

const INDEX_VIEW = buildView({
  universalIdentifier: INDEX_VIEW_UNIVERSAL_IDENTIFIER,
  key: ViewKey.INDEX,
  type: ViewType.TABLE,
});

const FIELDS_WIDGET_VIEW = buildView({
  universalIdentifier: FIELDS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
  key: null,
  type: ViewType.FIELDS_WIDGET,
});

const buildArgs = ({
  pendingFields = [buildField({ name: 'name' })],
  pendingViews = [INDEX_VIEW, FIELDS_WIDGET_VIEW],
  pendingViewFields = [],
}: {
  pendingFields?: UniversalFlatFieldMetadata[];
  pendingViews?: UniversalFlatView[];
  pendingViewFields?: UniversalFlatViewField[];
} = {}): BuildSideEffectsArgs<'objectMetadata'> =>
  ({
    flatEntity: {
      applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
      universalIdentifier: OBJECT_UNIVERSAL_IDENTIFIER,
      labelIdentifierFieldMetadataUniversalIdentifier:
        NAME_FIELD_UNIVERSAL_IDENTIFIER,
    },
    allFlatEntityOperationRecordByMetadataName: {
      fieldMetadata: {
        flatEntityToCreate: toRecordByUniversalIdentifier(pendingFields),
        flatEntityToUpdate: {},
        flatEntityToDelete: {},
      },
      view: {
        flatEntityToCreate: toRecordByUniversalIdentifier(pendingViews),
        flatEntityToUpdate: {},
        flatEntityToDelete: {},
      },
      ...(pendingViewFields.length > 0 && {
        viewField: {
          flatEntityToCreate: toRecordByUniversalIdentifier(pendingViewFields),
          flatEntityToUpdate: {},
          flatEntityToDelete: {},
        },
      }),
    } as unknown as AllFlatEntityOperationRecordByMetadataName,
    relatedFlatEntityMaps: {},
    context: {},
  }) as unknown as BuildSideEffectsArgs<'objectMetadata'>;

describe('ObjectDefaultViewFieldsOnCreateSideEffectHandlerService', () => {
  const handler =
    new (ObjectDefaultViewFieldsOnCreateSideEffectHandlerService as unknown as new () => ObjectDefaultViewFieldsOnCreateSideEffectHandlerService)();

  it('should create default view fields for the index and fields-widget views', () => {
    const result = handler.buildSideEffects(buildArgs());

    expect(result.status).toBe('success');

    if (result.status !== 'success') {
      throw new Error('expected success');
    }

    const createdViewFields = Object.values(
      result.operations.viewField?.flatEntityToCreate ?? {},
    );
    const indexViewFieldUniversalIdentifiers = createdViewFields
      .filter(
        (viewField) =>
          viewField.viewUniversalIdentifier === INDEX_VIEW_UNIVERSAL_IDENTIFIER,
      )
      .map((viewField) => viewField.fieldMetadataUniversalIdentifier);
    const fieldsWidgetViewFieldUniversalIdentifiers = createdViewFields
      .filter(
        (viewField) =>
          viewField.viewUniversalIdentifier ===
          FIELDS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
      )
      .map((viewField) => viewField.fieldMetadataUniversalIdentifier);

    expect(indexViewFieldUniversalIdentifiers).toEqual(
      FIELD_UNIVERSAL_IDENTIFIERS_VISIBLE_BY_DEFAULT,
    );
    expect(fieldsWidgetViewFieldUniversalIdentifiers).toEqual(
      FIELD_WIDGET_FIELD_UNIVERSAL_IDENTIFIERS_VISIBLE_BY_DEFAULT,
    );
  });

  it('should not create default view fields for views with pending explicit view fields', () => {
    const result = handler.buildSideEffects(
      buildArgs({
        pendingViewFields: [
          buildViewField({
            universalIdentifier: 'explicit-index-view-field',
            viewUniversalIdentifier: INDEX_VIEW_UNIVERSAL_IDENTIFIER,
          }),
          buildViewField({
            universalIdentifier: 'explicit-fields-widget-view-field',
            viewUniversalIdentifier: FIELDS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
          }),
        ],
      }),
    );

    expect(result.status).toBe('noop');
  });
});
