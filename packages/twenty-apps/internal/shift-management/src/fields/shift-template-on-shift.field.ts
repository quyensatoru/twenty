import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  SHIFT_OBJECT_UID,
  SHIFT_TEMPLATE_OBJECT_UID,
  SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID,
  SHIFTS_ON_SHIFT_TEMPLATE_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID,
  objectUniversalIdentifier: SHIFT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'shiftTemplate',
  label: 'Shift template',
  description: 'Template the shift was registered from',
  icon: 'IconClockCog',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: SHIFT_TEMPLATE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    SHIFTS_ON_SHIFT_TEMPLATE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'shiftTemplateId',
  },
});
