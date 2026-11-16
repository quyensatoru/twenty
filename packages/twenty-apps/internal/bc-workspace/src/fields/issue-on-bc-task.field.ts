import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_ISSUE_OBJECT_UID,
  BC_ISSUE_TASKS_FIELD_UID,
  BC_TASK_ISSUE_FIELD_UID,
  BC_TASK_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_TASK_ISSUE_FIELD_UID,
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  description: 'Client issue the task follows up',
  icon: 'IconAlertTriangle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: BC_ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_ISSUE_TASKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'issueId',
  },
});
