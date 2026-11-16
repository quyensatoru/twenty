import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_OPPORTUNITY_OBJECT_UID,
  BC_OPPORTUNITY_TASKS_FIELD_UID,
  BC_TASK_OBJECT_UID,
  BC_TASK_OPPORTUNITY_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_TASK_OPPORTUNITY_FIELD_UID,
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'opportunity',
  label: 'Opportunity',
  description: 'Upsell opportunity the task works on',
  icon: 'IconTargetArrow',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: BC_OPPORTUNITY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_OPPORTUNITY_TASKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'opportunityId',
  },
});
