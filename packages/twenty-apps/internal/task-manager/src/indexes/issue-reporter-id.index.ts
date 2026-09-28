import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_REPORTER_FIELD_UID,
  ISSUE_REPORTER_ID_INDEX_FIELD_UID,
  ISSUE_REPORTER_ID_INDEX_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_REPORTER_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_REPORTER_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_REPORTER_FIELD_UID,
    },
  ],
});
