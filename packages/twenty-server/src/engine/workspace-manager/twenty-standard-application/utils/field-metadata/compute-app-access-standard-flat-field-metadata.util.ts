import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';

// AppAccess is a junction/permission-grant record (grants a workspace member
// permissions on an app's scoped records) — only the base system fields are
// used, no createdBy/updatedBy/position/searchVector.
export const buildAppAccessStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'appAccess', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'appAccess'>, FlatFieldMetadata> => ({
  id: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'id',
      type: FieldMetadataType.UUID,
      label: i18nLabel(msg({ message: `Id`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({ message: `Id`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'uuid',
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  createdAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'createdAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Creation date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Creation date`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendar',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'now',
      settings: {
        displayFormat: DateDisplayFormat.RELATIVE,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  updatedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'updatedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Last update`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Last time the record was changed`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarClock',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'now',
      settings: {
        displayFormat: DateDisplayFormat.RELATIVE,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  deletedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'deletedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Deleted at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Date when the record was deleted`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarMinus',
      isSystem: true,
      isNullable: true,
      isUIEditable: false,
      settings: {
        displayFormat: DateDisplayFormat.RELATIVE,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  searchVector: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'searchVector',
      type: FieldMetadataType.TS_VECTOR,
      label: i18nLabel(
        msg({ message: `Search vector`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Field used for full-text search`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isSystem: true,
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  // Relation fields
  member: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'member',
      label: i18nLabel(
        msg({ message: `Member`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Workspace member granted this access`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: false,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'appAccesses',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.CASCADE,
        joinColumnName: 'memberId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  app: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'app',
      label: i18nLabel(msg({ message: `App`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({
          message: `App this access grant applies to`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconApps',
      isNullable: false,
      targetObjectName: 'app',
      targetFieldName: 'appAccesses',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.CASCADE,
        joinColumnName: 'appId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  // AppAccess-specific fields
  permissions: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'permissions',
      type: FieldMetadataType.MULTI_SELECT,
      label: i18nLabel(
        msg({ message: `Permissions`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Permissions granted on the app's scoped records`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconLock',
      isNullable: true,
      options: [
        {
          id: '52f56558-029b-476c-b7c0-9e76c88ca7e8',
          value: 'READ',
          label: i18nLabel(
            msg({ message: `Read`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'blue',
        },
        {
          id: 'fd804a65-c33d-4518-9c3e-7454827c4476',
          value: 'WRITE',
          label: i18nLabel(
            msg({ message: `Write`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'green',
        },
        {
          id: 'cee7909e-95dd-4b61-9f5e-3455ac635973',
          value: 'SOFT_DELETE',
          label: i18nLabel(
            msg({ message: `Soft delete`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'orange',
        },
        {
          id: '8367f10b-d877-4db5-8e7d-f8e803d97f53',
          value: 'DESTROY',
          label: i18nLabel(
            msg({ message: `Destroy`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'red',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
