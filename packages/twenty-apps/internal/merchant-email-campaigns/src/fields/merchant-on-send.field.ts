import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  EMAIL_SEND_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  MERCHANT_ON_SEND_FIELD_UID,
  SENDS_ON_MERCHANT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_ON_SEND_FIELD_UID,
  objectUniversalIdentifier: EMAIL_SEND_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchant',
  label: 'Merchant',
  icon: 'IconBuildingStore',
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: SENDS_ON_MERCHANT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'merchantId',
  },
});
