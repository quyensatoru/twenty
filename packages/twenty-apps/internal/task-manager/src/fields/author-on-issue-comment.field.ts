import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ISSUE_COMMENT_AUTHOR_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
  WORKSPACE_MEMBER_ISSUE_COMMENTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_COMMENT_AUTHOR_FIELD_UID,
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'author',
  label: 'Author',
  description: 'Comment author',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_ISSUE_COMMENTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'authorId',
  },
});
