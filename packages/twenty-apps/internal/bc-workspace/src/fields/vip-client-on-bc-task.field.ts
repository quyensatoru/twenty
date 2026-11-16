import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_TASK_OBJECT_UID,
  BC_TASK_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_TASKS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_TASK_VIP_CLIENT_FIELD_UID,
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'vipClient',
  label: 'VIP client',
  description: 'Client the task is about',
  icon: 'IconCrown',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: VIP_CLIENT_TASKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'vipClientId',
  },
});
