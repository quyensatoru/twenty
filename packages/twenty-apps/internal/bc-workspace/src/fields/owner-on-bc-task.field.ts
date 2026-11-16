import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_TASK_OBJECT_UID,
  BC_TASK_OWNER_FIELD_UID,
  WORKSPACE_MEMBER_BC_TASKS_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_TASK_OWNER_FIELD_UID,
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Owner',
  description: 'BC who owns the task',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_BC_TASKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
