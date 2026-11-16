import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_OPPORTUNITY_OBJECT_UID,
  BC_OPPORTUNITY_TASKS_FIELD_UID,
  BC_TASK_OBJECT_UID,
  BC_TASK_OPPORTUNITY_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_OPPORTUNITY_TASKS_FIELD_UID,
  objectUniversalIdentifier: BC_OPPORTUNITY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'tasks',
  label: 'Tasks',
  description: 'Tasks working the opportunity',
  icon: 'IconCheckbox',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_TASK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_TASK_OPPORTUNITY_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
