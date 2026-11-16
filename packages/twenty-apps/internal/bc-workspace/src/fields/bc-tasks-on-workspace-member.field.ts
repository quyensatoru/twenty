import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_TASK_OBJECT_UID,
  BC_TASK_OWNER_FIELD_UID,
  WORKSPACE_MEMBER_BC_TASKS_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_BC_TASKS_FIELD_UID,
  objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'bcTasks',
  label: 'BC tasks',
  description: 'BC tasks owned by this member',
  icon: 'IconCheckbox',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_TASK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_TASK_OWNER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
