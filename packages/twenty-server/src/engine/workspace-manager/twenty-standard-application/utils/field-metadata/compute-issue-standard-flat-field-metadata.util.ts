import { msg } from '@lingui/core/macro';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT } from 'src/engine/metadata-modules/object-metadata/constants/standard-relation-field-properties.constant';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';

export const buildIssueStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'issue', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'issue'>, FlatFieldMetadata> => ({
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
          message: `Issue record position`,
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

  // Issue-specific fields
  title: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'title',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Title`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Issue title`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconNotes',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  issueKey: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'issueKey',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg({ message: `Key`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({
          message: `Issue key, auto-generated from the project key`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconKey',
      isNullable: true,
      isUnique: true,
      isUIEditable: false,
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
      type: FieldMetadataType.RICH_TEXT,
      label: i18nLabel(
        msg({ message: `Description`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue description`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFilePencil',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  issueType: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'issueType',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Issue type`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Issue type`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconTag',
      isNullable: true,
      defaultValue: "'TASK'",
      options: [
        {
          id: 'a818e3d2-043f-4b33-99aa-759b0423c739',
          value: 'STORY',
          label: i18nLabel(
            msg({ message: `Story`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: '5f556d51-5a2b-4c19-9e0d-5f4f5c4f5f92',
          value: 'TASK',
          label: i18nLabel(
            msg({ message: `Task`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'blue',
        },
        {
          id: 'd6a5095b-9292-4200-abff-ff9f55bc56de',
          value: 'BUG',
          label: i18nLabel(
            msg({ message: `Bug`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'red',
        },
        {
          id: '6a2ed5d7-0b68-4d42-8181-eb2eae147607',
          value: 'SUBTASK',
          label: i18nLabel(
            msg({ message: `Subtask`, context: 'fieldMetadata.label' }),
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
  priority: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'priority',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Priority`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue priority`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFlag',
      isNullable: true,
      defaultValue: "'MEDIUM'",
      options: [
        {
          id: '7a3ac4b4-1f11-4ef1-95eb-ee0c52e6898c',
          value: 'LOWEST',
          label: i18nLabel(
            msg({ message: `Lowest`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'gray',
        },
        {
          id: 'e16557cb-f517-432f-86ee-be1af39501ba',
          value: 'LOW',
          label: i18nLabel(
            msg({ message: `Low`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'blue',
        },
        {
          id: 'ce1bb9a6-df3d-48a9-b1c2-ca172a288255',
          value: 'MEDIUM',
          label: i18nLabel(
            msg({ message: `Medium`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'yellow',
        },
        {
          id: '8e220276-11d4-4a12-a62b-dd9df11815f4',
          value: 'HIGH',
          label: i18nLabel(
            msg({ message: `High`, context: 'fieldMetadata.label' }),
          ),
          position: 3,
          color: 'orange',
        },
        {
          id: '0ef26535-456b-4568-baa3-8afd630dacc4',
          value: 'HIGHEST',
          label: i18nLabel(
            msg({ message: `Highest`, context: 'fieldMetadata.label' }),
          ),
          position: 4,
          color: 'red',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  resolution: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'resolution',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Resolution`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue resolution`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCircleCheck',
      isNullable: true,
      options: [
        {
          id: 'c363ead2-e423-4375-9fe4-0b0dedd6c72d',
          value: 'DONE',
          label: i18nLabel(
            msg({ message: `Done`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'green',
        },
        {
          id: '7822f7d8-b81c-417f-a11a-58bac696377c',
          value: 'WONT_DO',
          label: i18nLabel(
            msg({ message: `Won't Do`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'gray',
        },
        {
          id: '0a12e51d-b23d-41df-a313-7c3059d8cad5',
          value: 'DUPLICATE',
          label: i18nLabel(
            msg({ message: `Duplicate`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'orange',
        },
        {
          id: '0b2ccfe7-7544-4585-9b8e-62e6af8f7bea',
          value: 'CANNOT_REPRODUCE',
          label: i18nLabel(
            msg({
              message: `Cannot Reproduce`,
              context: 'fieldMetadata.label',
            }),
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
  storyPoints: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'storyPoints',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Story points`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Story points estimate`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconNumber',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  labels: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'labels',
      type: FieldMetadataType.MULTI_SELECT,
      label: i18nLabel(
        msg({ message: `Labels`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Issue labels`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconTags',
      isNullable: true,
      options: [
        {
          id: '79b31c21-da77-4ffe-8b44-ac02e9d3e4ce',
          value: 'BUG',
          label: i18nLabel(
            msg({ message: `Bug`, context: 'fieldMetadata.label' }),
          ),
          position: 0,
          color: 'red',
        },
        {
          id: '4bf90866-9ea1-4ce0-b6e8-727e7894eb99',
          value: 'ENHANCEMENT',
          label: i18nLabel(
            msg({ message: `Enhancement`, context: 'fieldMetadata.label' }),
          ),
          position: 1,
          color: 'blue',
        },
        {
          id: '8a18d617-df0c-4ecc-9a89-c5124dd652b1',
          value: 'DOCUMENTATION',
          label: i18nLabel(
            msg({ message: `Documentation`, context: 'fieldMetadata.label' }),
          ),
          position: 2,
          color: 'green',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  dueDate: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'dueDate',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Due date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue due date`,
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
  originalEstimateMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'originalEstimateMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({
          message: `Original estimate (minutes)`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Original time estimate in minutes`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClock',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  remainingEstimateMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'remainingEstimateMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({
          message: `Remaining estimate (minutes)`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Remaining time estimate in minutes`,
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
  timeSpentMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'timeSpentMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({
          message: `Time spent (minutes)`,
          context: 'fieldMetadata.label',
        }),
      ),
      description: i18nLabel(
        msg({
          message: `Total time logged in minutes`,
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
  assignee: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'assignee',
      label: i18nLabel(
        msg({ message: `Assignee`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue assignee`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'assignedIssues',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'assigneeId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  reporter: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'reporter',
      label: i18nLabel(
        msg({ message: `Reporter`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue reporter`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isNullable: true,
      targetObjectName: 'workspaceMember',
      targetFieldName: 'reportedIssues',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'reporterId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  merchants: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'merchants',
      label: i18nLabel(
        msg({ message: `Merchants`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Merchants linked to this issue`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconBuildingStore',
      isNullable: true,
      targetObjectName: 'issueMerchant',
      targetFieldName: 'issue',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
      junctionTargetFieldUniversalIdentifier:
        STANDARD_OBJECTS.issueMerchant.fields.merchant.universalIdentifier,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  project: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'project',
      label: i18nLabel(
        msg({ message: `Project`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue's project`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconListDetails',
      isNullable: false,
      targetObjectName: 'project',
      targetFieldName: 'issues',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  status: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'status',
      label: i18nLabel(
        msg({ message: `Status`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Issue status`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconProgressCheck',
      isNullable: true,
      targetObjectName: 'issueStatus',
      targetFieldName: 'issues',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'statusId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  sprint: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'sprint',
      label: i18nLabel(
        msg({ message: `Sprint`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue's sprint (null = backlog)`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconRun',
      isNullable: true,
      targetObjectName: 'sprint',
      targetFieldName: 'issues',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'sprintId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  epic: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'epic',
      label: i18nLabel(
        msg({ message: `Epic`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Issue's epic`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconStack2',
      isNullable: true,
      targetObjectName: 'epic',
      targetFieldName: 'issues',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'epicId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  parent: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'parent',
      label: i18nLabel(
        msg({ message: `Parent issue`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Parent issue (epic link for a story, story for a subtask)`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconArrowUpRight',
      isNullable: true,
      targetObjectName: 'issue',
      targetFieldName: 'children',
      settings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: RelationOnDeleteAction.SET_NULL,
        joinColumnName: 'parentId',
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  children: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'children',
      label: i18nLabel(
        msg({ message: `Child issues`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Child issues (stories or subtasks)`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconSitemap',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'issue',
      targetFieldName: 'parent',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  issueComments: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'issueComments',
      label: i18nLabel(
        msg({ message: `Comments`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue's comments`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconMessage',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'issueComment',
      targetFieldName: 'issue',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  worklogs: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'worklogs',
      label: i18nLabel(
        msg({ message: `Worklogs`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Issue's worklogs`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconClock',
      isNullable: true,
      isUIEditable: false,
      targetObjectName: 'worklog',
      targetFieldName: 'issue',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  attachments: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'attachments',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment.label,
      ),
      description: i18nLabel(
        msg({
          message: `Issue attachments`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.attachment
        .icon,
      isNullable: true,
      targetObjectName: 'attachment',
      targetFieldName: 'targetIssue',
      settings: {
        relationType: RelationType.ONE_TO_MANY,
      },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  timelineActivities: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'timelineActivities',
      isSystemSideEffect: true,
      label: i18nLabel(
        STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT.timelineActivity
          .label,
      ),
      description: i18nLabel(
        msg({
          message: `Timeline Activities linked to the issue`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: STANDARD_RELATION_FIELD_PROPERTIES_BY_RELATION_OBJECT
        .timelineActivity.icon,
      isNullable: true,
      targetObjectName: 'timelineActivity',
      targetFieldName: 'targetIssue',
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
