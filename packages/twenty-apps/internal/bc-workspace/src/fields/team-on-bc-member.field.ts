import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_MEMBER_OBJECT_UID,
  BC_MEMBER_TEAM_FIELD_UID,
  BC_TEAM_MEMBERS_FIELD_UID,
  BC_TEAM_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_MEMBER_TEAM_FIELD_UID,
  objectUniversalIdentifier: BC_MEMBER_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'team',
  label: 'Team',
  description: 'BC team',
  icon: 'IconUsersGroup',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: BC_TEAM_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_TEAM_MEMBERS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'teamId',
  },
});
