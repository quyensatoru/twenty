import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_ISSUE_OBJECT_UID,
  BC_ISSUE_TASKS_FIELD_UID,
  BC_TASK_ISSUE_FIELD_UID,
  BC_TASK_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_ISSUE_TASKS_FIELD_UID,
  objectUniversalIdentifier: BC_ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'tasks',
  label: 'Tasks',
  description: 'Follow-up tasks of the issue',
  icon: 'IconCheckbox',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_TASK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_TASK_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
