import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  MERCHANT_OBJECT_UID,
  MERCHANT_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_MERCHANTS_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_VIP_CLIENT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'vipClient',
  label: 'VIP client',
  description: 'VIP client this app install belongs to',
  icon: 'IconCrown',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: VIP_CLIENT_MERCHANTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'vipClientId',
  },
});
