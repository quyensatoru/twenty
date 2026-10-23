import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_DISCOUNTS_FIELD_UID,
  APP_OBJECT_UID,
  DISCOUNT_APP_FIELD_UID,
  DISCOUNT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_DISCOUNTS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'discounts',
  label: 'Discounts',
  description: 'Plan discount codes of this app',
  icon: 'IconDiscount',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: DISCOUNT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: DISCOUNT_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
