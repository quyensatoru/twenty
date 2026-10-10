import { defineIndex } from 'twenty-sdk/define';

import {
  REPOSITORY_OBJECT_UID,
  REPOSITORY_PROJECT_FIELD_UID,
  REPOSITORY_PROJECT_ID_INDEX_FIELD_UID,
  REPOSITORY_PROJECT_ID_INDEX_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: REPOSITORY_PROJECT_ID_INDEX_UID,
  objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
  fields: [
    {
      universalIdentifier: REPOSITORY_PROJECT_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: REPOSITORY_PROJECT_FIELD_UID,
    },
  ],
});
