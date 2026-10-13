import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  ISSUE_CRISP_CONVERSATIONS_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

// Declared here rather than in task-manager: the conversation side is this
// app's, and task-manager stays installable without Crisp.
export default defineField({
  universalIdentifier: ISSUE_CRISP_CONVERSATIONS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'crispConversations',
  label: 'Crisp conversations',
  description: 'Support chats that reported this issue',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
    junctionTargetFieldUniversalIdentifier:
      CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  },
});
