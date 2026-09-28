import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_STATUS_PROJECT_FIELD_UID,
  ISSUE_STATUS_PROJECT_ID_INDEX_FIELD_UID,
  ISSUE_STATUS_PROJECT_ID_INDEX_UID,
  ISSUE_STATUS_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_STATUS_PROJECT_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_STATUS_PROJECT_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_STATUS_PROJECT_FIELD_UID,
    },
  ],
});
