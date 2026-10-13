import { defineIndex } from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_CONVERSATION_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_ISSUE_FIELD_UID,
  CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_UID,
} from '../constants/universal-identifiers';

// One link per pair: a double click on "link" must not show the issue twice.
export default defineIndex({
  universalIdentifier: CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  isUnique: true,
  fields: [
    {
      universalIdentifier:
        CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_CONVERSATION_FIELD_UID,
      fieldUniversalIdentifier: CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID,
    },
    {
      universalIdentifier: CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_ISSUE_FIELD_UID,
      fieldUniversalIdentifier: CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID,
    },
  ],
});
