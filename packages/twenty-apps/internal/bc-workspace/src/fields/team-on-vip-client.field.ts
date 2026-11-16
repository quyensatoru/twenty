import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_TEAM_FIELD_UID,
  BC_TEAM_VIP_CLIENTS_FIELD_UID,
  BC_TEAM_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_TEAM_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'team',
  label: 'Team',
  description: 'Team that owns the client',
  icon: 'IconUsersGroup',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: BC_TEAM_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_TEAM_VIP_CLIENTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'teamId',
  },
});
