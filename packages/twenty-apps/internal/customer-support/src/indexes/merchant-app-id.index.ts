import { defineIndex } from 'twenty-sdk/define';

import {
  MERCHANT_APP_FIELD_UID,
  MERCHANT_APP_ID_INDEX_FIELD_UID,
  MERCHANT_APP_ID_INDEX_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: MERCHANT_APP_ID_INDEX_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: MERCHANT_APP_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: MERCHANT_APP_FIELD_UID,
    },
  ],
});
