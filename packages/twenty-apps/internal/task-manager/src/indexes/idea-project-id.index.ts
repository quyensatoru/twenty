import { defineIndex } from 'twenty-sdk/define';

import {
  IDEA_OBJECT_UID,
  IDEA_PROJECT_ID_FIELD_UID,
  IDEA_PROJECT_ID_INDEX_FIELD_UID,
  IDEA_PROJECT_ID_INDEX_UID,
} from '../constants/product-backlog';

export default defineIndex({
  universalIdentifier: IDEA_PROJECT_ID_INDEX_UID,
  objectUniversalIdentifier: IDEA_OBJECT_UID,
  fields: [
    {
      universalIdentifier: IDEA_PROJECT_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: IDEA_PROJECT_ID_FIELD_UID,
    },
  ],
});
