import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { DateDisplayFormat, FieldMetadataType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';

export const buildSpecialDayStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'specialDay', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'specialDay'>, FlatFieldMetadata> => ({
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
  position: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'position',
      type: FieldMetadataType.POSITION,
      label: i18nLabel(
        msg({ message: `Position`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Special day record position`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHierarchy2',
      isSystem: true,
      isNullable: false,
      defaultValue: 0,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  // Special-day-specific fields
  name: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'name',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Name`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Special day display name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  kind: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'kind',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Kind`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Repeats yearly or applies to one specific date`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconRepeat',
      isNullable: false,
      defaultValue: "'YEARLY'",
      options: [
        {
          id: 'b0412a97-12b0-4338-8f94-57bada9a7906',
          value: 'YEARLY',
          label: i18nLabel(
            msg({ message: `Yearly`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: 'd8a66473-170d-4ce2-a7ae-d65db3a1dba4',
          value: 'SPECIFIC',
          label: i18nLabel(
            msg({ message: `Specific date`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'purple',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  month: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'month',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Month`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `1-12, used when kind is Yearly`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarMonth',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  day: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'day',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(msg({ message: `Day`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({
          message: `1-31, used when kind is Yearly`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  date: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'date',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `YYYY-MM-DD, used when kind is Specific date`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  multiplier: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'multiplier',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Multiplier`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Pay multiplier, e.g. 2 = 200%`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPercentage',
      isNullable: false,
      defaultValue: 2,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  isActive: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'isActive',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(
        msg({ message: `Active`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Inactive special days are ignored`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconToggleRight',
      isNullable: false,
      defaultValue: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  createdBy: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'createdBy',
      type: FieldMetadataType.ACTOR,
      label: i18nLabel(
        msg({ message: `Created by`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The creator of the record`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCreativeCommonsSa',
      isSystem: true,
      isUIEditable: false,
      isNullable: false,
      defaultValue: {
        source: "'MANUAL'",
        name: "'System'",
        workspaceMemberId: null,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  updatedBy: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'updatedBy',
      type: FieldMetadataType.ACTOR,
      label: i18nLabel(
        msg({ message: `Updated by`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The workspace member who last updated the record`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isSystem: true,
      isUIEditable: false,
      isNullable: false,
      defaultValue: {
        source: "'MANUAL'",
        name: "'System'",
        workspaceMemberId: null,
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
});
