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

export const buildShiftStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'shift', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'shift'>, FlatFieldMetadata> => ({
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
          message: `Shift record position`,
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

  // Shift-specific fields
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
          message: `Auto-generated "<code> <date>"`,
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
          message: `YYYY-MM-DD, ICT`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarEvent',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  status: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'status',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Status`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Shift lifecycle status`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: "'UPCOMING'",
      options: [
        {
          id: '65e7d5a4-e166-4007-993a-bd7e6ac05311',
          value: 'UPCOMING',
          label: i18nLabel(
            msg({ message: `Upcoming`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'blue',
        },
        {
          id: '295ce6de-129e-4605-a968-b8c9ca3d92d8',
          value: 'IN_PROGRESS',
          label: i18nLabel(
            msg({ message: `In progress`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'yellow',
        },
        {
          id: 'f19012d6-1415-416a-8f45-0bd4a683805b',
          value: 'COMPLETED',
          label: i18nLabel(
            msg({ message: `Completed`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'green',
        },
        {
          id: '3be5f0d4-8f1d-46c4-aace-c8baf21b35b6',
          value: 'CANCELLED',
          label: i18nLabel(
            msg({ message: `Cancelled`, context: 'fieldMetadata.label' }),
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
  templateCode: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'templateCode',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Template code`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Snapshot of the template code, survives template archive/rename`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconHash',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  templateName: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'templateName',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Template name`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Snapshot of the template name`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconAbc',
      isNullable: true,
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
        msg({
          message: `Snapshot of the template start time, HH:mm`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockPlay',
      isNullable: true,
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
          message: `Snapshot of the template end time, HH:mm`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockStop',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  checkInAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'checkInAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Checked in at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `When the member checked in`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconLogin',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  checkOutAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'checkOutAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Checked out at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `When the member checked out`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconLogout',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  checkInLateMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'checkInLateMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({
          message: `Check-in late (minutes)`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Empty = on time; >=1 = minutes past shift start (no grace)`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconAlarmSnooze',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  workingMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'workingMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Working minutes`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Payable minutes, frozen at check-out`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockHour4',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  rateMultiplier: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'rateMultiplier',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Rate multiplier`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Empty = 1.0; stamped from special days at registration`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconPercentage',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  handoverNote: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'handoverNote',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Handover note`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Pending conversations noted at check-out`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconNotes',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  cancelReason: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'cancelReason',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Cancel reason`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Why the shift was cancelled`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMessageCircleOff',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  cancelCategory: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'cancelCategory',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Cancel category`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Cancellation category`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconTag',
      isNullable: true,
      options: [
        {
          id: '2352ce25-a81e-4051-8bc2-fe1588d11a32',
          value: 'SICK',
          label: i18nLabel(
            msg({ message: `Sick leave`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'red',
        },
        {
          id: '09c2ad28-f433-4c47-b413-319e6d392b11',
          value: 'PERSONAL',
          label: i18nLabel(
            msg({ message: `Personal`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'orange',
        },
        {
          id: 'd863d3c8-2517-4434-9713-128f43ab3962',
          value: 'SWAP',
          label: i18nLabel(
            msg({ message: `Shift swap`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'blue',
        },
        {
          id: '22eedc06-36b3-4edd-b06d-ce88f0eb8374',
          value: 'OTHER',
          label: i18nLabel(
            msg({ message: `Other`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'gray',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  cancelledAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'cancelledAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Cancelled at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `When the shift was cancelled`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarX',
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
          message: `Workspace member who works the shift`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'shifts',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'memberId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  shiftTemplate: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'shiftTemplate',
      label: i18nLabel(
        msg({ message: `Shift template`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Template the shift was registered from`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClockCog',
      isNullable: true,
      targetObjectName: 'shiftTemplate',
      targetFieldName: 'shifts',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'shiftTemplateId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
