import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';

export const buildShiftTemplateStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'shiftTemplate', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'shiftTemplate'>, FlatFieldMetadata> => ({
  id: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'id',
      type: FieldMetadataType.UUID,
      label: i18nLabel(msg({ message: `ID`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({ message: `ID`, context: 'fieldMetadata.description' }),
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
          message: `Shift template record position`,
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

  // Shift-template-specific fields
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
          message: `Shift display name`,
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
  code: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'code',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Code`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Short shift code, e.g. SAE-TT-D`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  startTime: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'startTime',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Start time`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `HH:mm, ICT`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconClockPlay',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  endTime: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'endTime',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `End time`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `HH:mm, ICT — 24:00 allowed`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockStop',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  dayKind: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'dayKind',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Day kind`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Weekday, weekend or holiday OT`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarWeek',
      isNullable: true,
      options: [
        {
          id: '5e320c80-9917-4dff-ba32-8afc35ff0f69',
          value: 'WEEKDAY',
          label: i18nLabel(
            msg({ message: `Weekday`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'blue',
        },
        {
          id: 'f825a6a2-ff18-420e-9854-9594b06bd922',
          value: 'WEEKEND',
          label: i18nLabel(
            msg({ message: `Weekend`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'turquoise',
        },
        {
          id: '6258f155-5694-4ba4-8506-0c8cc9d1ff3c',
          value: 'HOLIDAY_OT',
          label: i18nLabel(
            msg({ message: `Holiday OT`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'orange',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  earlyCheckInMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'earlyCheckInMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({
          message: `Early check-in (minutes)`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Check-in opens this many minutes before start. Empty = no guard`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockUp',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  lateCheckOutMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'lateCheckOutMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({
          message: `Late check-out grace (minutes)`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Payable minutes cap grace after end. Empty = cap disabled`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockDown',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  salaryPerHour: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'salaryPerHour',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Salary per hour`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `VND per hour, optional. Hidden from the catalog view; members see it only through their own report`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCurrencyDong',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  color: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'color',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Color`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Calendar badge color`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPalette',
      isNullable: true,
      defaultValue: "'#94a3b8'",
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
          message: `Inactive templates cannot be registered`,
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
  description: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'description',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Description`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Description`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconFileDescription',
      isNullable: true,
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

  // Relation fields
  shifts: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'shifts',
      label: i18nLabel(
        msg({ message: `Shifts`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Shifts registered from this template`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarClock',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'shift',
      targetFieldName: 'shiftTemplate',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
