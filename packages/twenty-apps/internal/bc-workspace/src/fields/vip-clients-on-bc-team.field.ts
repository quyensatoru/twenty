import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_TEAM_FIELD_UID,
  BC_TEAM_VIP_CLIENTS_FIELD_UID,
  BC_TEAM_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_TEAM_VIP_CLIENTS_FIELD_UID,
  objectUniversalIdentifier: BC_TEAM_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'vipClients',
  label: 'VIP clients',
  description: 'VIP clients owned by the team',
  icon: 'IconCrown',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: VIP_CLIENT_TEAM_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
