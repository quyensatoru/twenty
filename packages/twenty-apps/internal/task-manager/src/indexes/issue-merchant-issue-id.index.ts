import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_ISSUE_FIELD_UID,
  ISSUE_MERCHANT_ISSUE_ID_INDEX_FIELD_UID,
  ISSUE_MERCHANT_ISSUE_ID_INDEX_UID,
  ISSUE_MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: ISSUE_MERCHANT_ISSUE_ID_INDEX_UID,
  objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: ISSUE_MERCHANT_ISSUE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_MERCHANT_ISSUE_FIELD_UID,
    },
  ],
});
