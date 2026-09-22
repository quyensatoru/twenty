import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  PROSPECT_OBJECT_UID,
  PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEALS_ON_PROSPECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: UPSELL_DEALS_ON_PROSPECT_FIELD_UID,
  objectUniversalIdentifier: PROSPECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'upsellDeals',
  label: 'Upsell deals',
  icon: 'IconTrendingUp',
  relationTargetObjectMetadataUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
