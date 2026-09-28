import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_COMMENT_BODY_V2_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineObject({
  universalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  nameSingular: 'issueComment',
  namePlural: 'issueComments',
  labelSingular: 'Issue Comment',
  labelPlural: 'Issue Comments',
  description: 'A comment on an issue',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: ISSUE_COMMENT_BODY_V2_FIELD_UID,
      type: FieldType.RICH_TEXT,
      name: 'bodyV2',
      label: 'Body',
      description: 'Comment body',
      icon: 'IconFilePencil',
      isNullable: true,
    },
  ],
});
