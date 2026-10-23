import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  DISCOUNT_MERCHANT_FIELD_UID,
  DISCOUNT_OBJECT_UID,
  MERCHANT_DISCOUNTS_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_DISCOUNTS_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'discounts',
  label: 'Discounts',
  description: 'Plan discount codes made for this merchant',
  icon: 'IconDiscount',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: DISCOUNT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: DISCOUNT_MERCHANT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
