import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  CRISP_CONVERSATION_ISSUES_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CRISP_CONVERSATION_ISSUES_FIELD_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: 'Issues',
  description: 'Issues raised from this conversation',
  icon: 'IconLayoutKanban',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
    junctionTargetFieldUniversalIdentifier:
      CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  },
});
