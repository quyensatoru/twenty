import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  CRISP_CONVERSATION_ISSUES_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'conversation',
  label: 'Conversation',
  description: 'The linked Crisp conversation',
  icon: 'IconMessage',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    CRISP_CONVERSATION_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CRISP_CONVERSATION_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'conversationId',
  },
});
