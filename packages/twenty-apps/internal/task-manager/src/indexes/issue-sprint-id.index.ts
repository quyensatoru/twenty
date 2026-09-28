import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_SPRINT_FIELD_UID,
  ISSUE_SPRINT_ID_INDEX_FIELD_UID,
  ISSUE_SPRINT_ID_INDEX_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_SPRINT_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_SPRINT_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_SPRINT_FIELD_UID,
    },
  ],
});
