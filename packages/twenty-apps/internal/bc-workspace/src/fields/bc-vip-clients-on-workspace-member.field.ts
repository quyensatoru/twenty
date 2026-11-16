import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PIC_FIELD_UID,
  WORKSPACE_MEMBER_BC_VIP_CLIENTS_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_BC_VIP_CLIENTS_FIELD_UID,
  objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'bcVipClients',
  label: 'VIP clients',
  description: 'VIP clients this member owns as PIC',
  icon: 'IconCrown',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: VIP_CLIENT_PIC_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
