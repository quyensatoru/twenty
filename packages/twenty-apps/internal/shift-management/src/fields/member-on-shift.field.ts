import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  MEMBER_ON_SHIFT_FIELD_UID,
  SHIFT_OBJECT_UID,
  SHIFTS_ON_WORKSPACE_MEMBER_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MEMBER_ON_SHIFT_FIELD_UID,
  objectUniversalIdentifier: SHIFT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'member',
  label: 'Member',
  description: 'Workspace member who works the shift',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    SHIFTS_ON_WORKSPACE_MEMBER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'memberId',
  },
});
