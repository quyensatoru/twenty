import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_COMMENT_ISSUE_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_ISSUE_COMMENTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_COMMENT_ISSUE_FIELD_UID,
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  description: 'Commented issue',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_ISSUE_COMMENTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
