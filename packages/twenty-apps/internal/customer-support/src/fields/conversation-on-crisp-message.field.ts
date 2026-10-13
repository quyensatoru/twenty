import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_MESSAGES_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  CRISP_MESSAGE_CONVERSATION_FIELD_UID,
  CRISP_MESSAGE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CRISP_MESSAGE_CONVERSATION_FIELD_UID,
  objectUniversalIdentifier: CRISP_MESSAGE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'conversation',
  label: 'Conversation',
  description: 'Conversation the message belongs to',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    CRISP_CONVERSATION_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CRISP_CONVERSATION_MESSAGES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'conversationId',
  },
});
