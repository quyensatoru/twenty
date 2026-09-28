import { defineObject } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import { ISSUE_MERCHANT_OBJECT_UID } from '../constants/universal-identifiers';

// Junction object backing the Issue <-> Merchant many-to-many. Never browsed
// directly, only surfaced through Issue.merchants / Merchant.issues.
export default defineObject({
  universalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  nameSingular: 'issueMerchant',
  namePlural: 'issueMerchants',
  labelSingular: 'Issue Merchant',
  labelPlural: 'Issue Merchants',
  description: "An issue's link to a merchant",
  icon: 'IconBuildingStore',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
      name: 'id',
    }),
  fields: [],
});
