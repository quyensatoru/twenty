import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_COMMENT_ISSUE_FIELD_UID,
  ISSUE_COMMENT_ISSUE_ID_INDEX_FIELD_UID,
  ISSUE_COMMENT_ISSUE_ID_INDEX_UID,
  ISSUE_COMMENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_COMMENT_ISSUE_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_COMMENT_ISSUE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_COMMENT_ISSUE_FIELD_UID,
    },
  ],
});
