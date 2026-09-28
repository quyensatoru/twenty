import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MEMBER_ON_SHIFT_FIELD_UID,
  SHIFT_OBJECT_UID,
  SHIFTS_ON_WORKSPACE_MEMBER_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

// Added by this app onto the standard `workspaceMember` object — the only
// standard object shift touches.
export default defineField({
  universalIdentifier: SHIFTS_ON_WORKSPACE_MEMBER_FIELD_UID,
  objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'shifts',
  label: 'Shifts',
  description: 'Shifts worked by the workspace member',
  icon: 'IconCalendarClock',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: SHIFT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MEMBER_ON_SHIFT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
