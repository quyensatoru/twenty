import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_ISSUE_FIELD_UID,
  ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_MERCHANTS_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

// A junction relation, not a plain one-to-many: `junctionTargetFieldUniversalIdentifier`
// names the far side of the hop, so the UI offers merchants directly on an
// issue and hides the `issueMerchant` row in between. Declaring only the
// MANY_TO_ONE sides on the junction object would leave this field out of the
// manifest, and sync would destroy the one production already has.
export default defineField({
  universalIdentifier: ISSUE_MERCHANTS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchants',
  label: 'Merchants',
  description: 'Merchants linked to this issue',
  icon: 'IconBuildingStore',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_MERCHANT_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
    junctionTargetFieldUniversalIdentifier: ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  },
});
