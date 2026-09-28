import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  SHIFT_OBJECT_UID,
  SHIFT_TEMPLATE_OBJECT_UID,
  SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID,
  SHIFTS_ON_SHIFT_TEMPLATE_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SHIFTS_ON_SHIFT_TEMPLATE_FIELD_UID,
  objectUniversalIdentifier: SHIFT_TEMPLATE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'shifts',
  label: 'Shifts',
  description: 'Shifts registered from this template',
  icon: 'IconCalendarClock',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: SHIFT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
