import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  ISSUE_CRISP_CONVERSATIONS_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  description: 'The linked issue',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_CRISP_CONVERSATIONS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
