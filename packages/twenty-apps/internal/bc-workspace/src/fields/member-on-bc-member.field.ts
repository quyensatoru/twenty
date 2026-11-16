import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_MEMBER_MEMBER_FIELD_UID,
  BC_MEMBER_OBJECT_UID,
  WORKSPACE_MEMBER_BC_MEMBERSHIPS_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_MEMBER_MEMBER_FIELD_UID,
  objectUniversalIdentifier: BC_MEMBER_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'member',
  label: 'Workspace member',
  description: 'Workspace member',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_BC_MEMBERSHIPS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'memberId',
  },
});
