import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PIC_FIELD_UID,
  WORKSPACE_MEMBER_BC_VIP_CLIENTS_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_PIC_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'pic',
  label: 'PIC',
  description: 'Business Consultant who owns the client',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_BC_VIP_CLIENTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'picId',
  },
});
