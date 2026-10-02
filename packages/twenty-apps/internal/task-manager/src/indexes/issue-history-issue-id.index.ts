import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_HISTORY_ISSUE_FIELD_UID,
  ISSUE_HISTORY_ISSUE_ID_INDEX_FIELD_UID,
  ISSUE_HISTORY_ISSUE_ID_INDEX_UID,
  ISSUE_HISTORY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_HISTORY_ISSUE_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_HISTORY_ISSUE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_HISTORY_ISSUE_FIELD_UID,
    },
  ],
});
