import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_PAYMENT_OBJECT_UID,
  BC_PAYMENT_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PAYMENTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_PAYMENT_VIP_CLIENT_FIELD_UID,
  objectUniversalIdentifier: BC_PAYMENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'vipClient',
  label: 'VIP client',
  description: 'Client who paid',
  icon: 'IconCrown',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: VIP_CLIENT_PAYMENTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'vipClientId',
  },
});
