import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  DISCOUNT_OBJECT_UID,
  DISCOUNT_SYNC_LOG_DISCOUNT_FIELD_UID,
  DISCOUNT_SYNC_LOG_OBJECT_UID,
  DISCOUNT_SYNC_LOGS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DISCOUNT_SYNC_LOG_DISCOUNT_FIELD_UID,
  objectUniversalIdentifier: DISCOUNT_SYNC_LOG_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'discount',
  label: 'Discount',
  icon: 'IconDiscount',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: DISCOUNT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: DISCOUNT_SYNC_LOGS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'discountId',
  },
});
