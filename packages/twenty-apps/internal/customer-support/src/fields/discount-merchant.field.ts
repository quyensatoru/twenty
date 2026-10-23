import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  DISCOUNT_MERCHANT_FIELD_UID,
  DISCOUNT_OBJECT_UID,
  MERCHANT_DISCOUNTS_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DISCOUNT_MERCHANT_FIELD_UID,
  objectUniversalIdentifier: DISCOUNT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchant',
  label: 'Merchant',
  description: 'Merchant the code was made for',
  icon: 'IconBuildingStore',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MERCHANT_DISCOUNTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'merchantId',
  },
});
