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
  // `id` is engine-derived, so it can never appear in `fields` below and
  // `twenty plan` warns that it cannot verify this identifier. The warning is
  // a false alarm here and the two alternatives are both worse: omitting the
  // identifier makes the engine synthesise a `name` column on the table, and
  // declaring `id` in `fields` is rejected outright with
  // FIELD_MUTATION_NOT_ALLOWED. The derived values are pinned by
  // __tests__/derived-label-identifiers.test.ts against what the engine stores.
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
      isSearchable: true,
    },
  ],
});
