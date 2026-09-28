import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_ASSIGNEE_FIELD_UID,
  ISSUE_ASSIGNEE_ID_INDEX_FIELD_UID,
  ISSUE_ASSIGNEE_ID_INDEX_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_ASSIGNEE_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_ASSIGNEE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_ASSIGNEE_FIELD_UID,
    },
  ],
});
