import { defineIndex } from 'twenty-sdk/define';

import {
  EPIC_ASSIGNEE_FIELD_UID,
  EPIC_ASSIGNEE_ID_INDEX_FIELD_UID,
  EPIC_ASSIGNEE_ID_INDEX_UID,
  EPIC_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: EPIC_ASSIGNEE_ID_INDEX_UID,
  objectUniversalIdentifier: EPIC_OBJECT_UID,
  fields: [
    {
      universalIdentifier: EPIC_ASSIGNEE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: EPIC_ASSIGNEE_FIELD_UID,
    },
  ],
});
