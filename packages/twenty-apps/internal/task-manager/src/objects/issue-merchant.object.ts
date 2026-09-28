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
  // `id` is engine-derived, so it can never appear in `fields` below and
  // `twenty plan` warns that it cannot verify this identifier. The warning is
  // a false alarm here and the two alternatives are both worse: omitting the
  // identifier makes the engine synthesise a `name` column on the table, and
  // declaring `id` in `fields` is rejected outright with
  // FIELD_MUTATION_NOT_ALLOWED. The derived values are pinned by
  // __tests__/derived-label-identifiers.test.ts against what the engine stores.
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
      name: 'id',
    }),
  fields: [],
});
