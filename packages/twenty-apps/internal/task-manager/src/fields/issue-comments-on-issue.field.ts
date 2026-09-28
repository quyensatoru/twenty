import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_ISSUE_COMMENTS_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_COMMENT_ISSUE_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_ISSUE_COMMENTS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueComments',
  label: "Comments",
  description: "Issue's comments",
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_COMMENT_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
