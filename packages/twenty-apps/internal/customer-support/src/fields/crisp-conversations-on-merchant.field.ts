import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_MERCHANT_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  MERCHANT_CRISP_CONVERSATIONS_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_CRISP_CONVERSATIONS_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'crispConversations',
  label: 'Crisp conversations',
  description: 'Support chats of this merchant',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    CRISP_CONVERSATION_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CRISP_CONVERSATION_MERCHANT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
