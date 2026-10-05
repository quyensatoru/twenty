import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  MERCHANT_OBJECT_UID,
  MERCHANTS_ON_PROSPECT_FIELD_UID,
  PROSPECT_OBJECT_UID,
  PROSPECT_ON_MERCHANT_FIELD_UID,
} from '../constants/universal-identifiers';

// The relation deliberately hangs off merchant, not off prospect: a merchant
// row is per (shop, app), so several of them fold into one prospect, and
// keeping the foreign key here leaves prospect free of any MANY_TO_ONE edge
// that would drag it into app-scope enforcement.
export default defineField({
  universalIdentifier: PROSPECT_ON_MERCHANT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'prospect',
  label: 'Prospect',
  description: 'BD prospect this merchant rolls up to, matched by domain',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier: PROSPECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    MERCHANTS_ON_PROSPECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'prospectId',
  },
});
