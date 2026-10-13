import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_MERCHANT_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  MERCHANT_CRISP_CONVERSATIONS_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CRISP_CONVERSATION_MERCHANT_FIELD_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchant',
  label: 'Merchant',
  description: 'Merchant the chat was matched to',
  icon: 'IconBuildingStore',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    MERCHANT_CRISP_CONVERSATIONS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'merchantId',
  },
});
