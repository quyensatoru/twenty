import { defineIndex } from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_ISSUE_FIELD_UID,
  ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_MERCHANT_UNIQUE_INDEX_ISSUE_FIELD_UID,
  ISSUE_MERCHANT_UNIQUE_INDEX_MERCHANT_FIELD_UID,
  ISSUE_MERCHANT_UNIQUE_INDEX_UID,
} from '../constants/universal-identifiers';

// Column order is (merchantId, issueId), matching the fork's
// merchantIssueUniqueIndex: the junction is read merchant-first when
// resolving "which issues touch this merchant".
export default defineIndex({
  universalIdentifier: ISSUE_MERCHANT_UNIQUE_INDEX_UID,
  objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  isUnique: true,
  fields: [
    {
      universalIdentifier: ISSUE_MERCHANT_UNIQUE_INDEX_MERCHANT_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_MERCHANT_MERCHANT_FIELD_UID,
    },
    {
      universalIdentifier: ISSUE_MERCHANT_UNIQUE_INDEX_ISSUE_FIELD_UID,
      fieldUniversalIdentifier: ISSUE_MERCHANT_ISSUE_FIELD_UID,
    },
  ],
});
