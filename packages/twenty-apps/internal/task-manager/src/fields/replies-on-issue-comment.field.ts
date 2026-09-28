import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_COMMENT_REPLIES_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_COMMENT_PARENT_COMMENT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_COMMENT_REPLIES_FIELD_UID,
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'replies',
  label: 'Replies',
  description: 'Replies to this comment',
  icon: 'IconArrowDownRight',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_COMMENT_PARENT_COMMENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
