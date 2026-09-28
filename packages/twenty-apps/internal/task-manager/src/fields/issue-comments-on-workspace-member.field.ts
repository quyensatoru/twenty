import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_ISSUE_COMMENTS_FIELD_UID,
  ISSUE_COMMENT_AUTHOR_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_ISSUE_COMMENTS_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'issueComments',
  label: 'Issue comments',
  description: 'Issue comments authored by the workspace member',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_COMMENT_AUTHOR_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
