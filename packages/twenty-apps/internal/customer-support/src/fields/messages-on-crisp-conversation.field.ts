import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_MESSAGES_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  CRISP_MESSAGE_CONVERSATION_FIELD_UID,
  CRISP_MESSAGE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CRISP_CONVERSATION_MESSAGES_FIELD_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'messages',
  label: 'Messages',
  description: 'Messages of the conversation',
  icon: 'IconMessages',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: CRISP_MESSAGE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CRISP_MESSAGE_CONVERSATION_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
