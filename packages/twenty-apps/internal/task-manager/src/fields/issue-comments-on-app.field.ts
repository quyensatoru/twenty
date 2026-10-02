import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_ISSUE_COMMENTS_FIELD_UID,
  APP_OBJECT_UID,
  ISSUE_COMMENT_APP_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ISSUE_COMMENTS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueComments',
  label: 'Issue comments',
  description: 'Issue comments belonging to this app',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_COMMENT_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
