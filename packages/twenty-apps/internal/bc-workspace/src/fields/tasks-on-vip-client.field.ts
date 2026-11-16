import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_TASK_OBJECT_UID,
  BC_TASK_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_TASKS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_TASKS_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'tasks',
  label: 'BC tasks',
  description: 'BC tasks about the client',
  icon: 'IconCheckbox',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_TASK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_TASK_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
