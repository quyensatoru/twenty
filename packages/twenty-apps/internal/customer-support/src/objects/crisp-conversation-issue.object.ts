import { defineObject } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import { CRISP_CONVERSATION_ISSUE_OBJECT_UID } from '../constants/universal-identifiers';

// Junction between a chat and the issues it raised. Many-to-many: one bug is
// reported by several merchants, and one chat can surface several bugs.
export default defineObject({
  universalIdentifier: CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  nameSingular: 'crispConversationIssue',
  namePlural: 'crispConversationIssues',
  labelSingular: 'Conversation issue',
  labelPlural: 'Conversation issues',
  description: 'Links a Crisp conversation to an issue',
  icon: 'IconLink',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: CRISP_CONVERSATION_ISSUE_OBJECT_UID,
      name: 'id',
    }),
  fields: [],
});
