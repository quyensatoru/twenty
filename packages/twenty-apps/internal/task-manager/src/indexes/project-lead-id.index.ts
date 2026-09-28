import { defineIndex } from 'twenty-sdk/define';

import {
  PROJECT_LEAD_FIELD_UID,
  PROJECT_LEAD_ID_INDEX_FIELD_UID,
  PROJECT_LEAD_ID_INDEX_UID,
  PROJECT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: PROJECT_LEAD_ID_INDEX_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: PROJECT_LEAD_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: PROJECT_LEAD_FIELD_UID,
    },
  ],
});
