import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_COMMENT_PARENT_COMMENT_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_COMMENT_REPLIES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_COMMENT_PARENT_COMMENT_FIELD_UID,
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'parentComment',
  label: 'Parent comment',
  description: 'Comment this is a reply to',
  icon: 'IconArrowUpRight',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_COMMENT_REPLIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'parentCommentId',
  },
});
