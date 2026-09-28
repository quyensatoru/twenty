import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  MERCHANT_ISSUES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchant',
  label: 'Merchant',
  description: 'The linked merchant',
  icon: 'IconBuildingStore',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MERCHANT_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'merchantId',
  },
});
