import { defineIndex } from 'twenty-sdk/define';

import {
  APP_ACCESS_APP_FIELD_UID,
  APP_ACCESS_APP_ID_INDEX_FIELD_UID,
  APP_ACCESS_APP_ID_INDEX_UID,
  APP_ACCESS_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: APP_ACCESS_APP_ID_INDEX_UID,
  objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  fields: [
    {
      universalIdentifier: APP_ACCESS_APP_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: APP_ACCESS_APP_FIELD_UID,
    },
  ],
});
