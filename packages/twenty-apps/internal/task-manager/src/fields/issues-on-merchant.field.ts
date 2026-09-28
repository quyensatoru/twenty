import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_ISSUE_FIELD_UID,
  ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  MERCHANT_ISSUES_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

// The mirror of `issue.merchants`: same junction, walked from the other end.
export default defineField({
  universalIdentifier: MERCHANT_ISSUES_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: 'Issues',
  description: 'Issues linked to the merchant',
  icon: 'IconLayoutKanban',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
    junctionTargetFieldUniversalIdentifier: ISSUE_MERCHANT_ISSUE_FIELD_UID,
  },
});
