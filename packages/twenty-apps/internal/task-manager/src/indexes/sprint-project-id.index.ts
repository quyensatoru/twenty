import { defineIndex } from 'twenty-sdk/define';

import {
  SPRINT_PROJECT_FIELD_UID,
  SPRINT_PROJECT_ID_INDEX_FIELD_UID,
  SPRINT_PROJECT_ID_INDEX_UID,
  SPRINT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SPRINT_PROJECT_ID_INDEX_UID,
  objectUniversalIdentifier: SPRINT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: SPRINT_PROJECT_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: SPRINT_PROJECT_FIELD_UID,
    },
  ],
});
