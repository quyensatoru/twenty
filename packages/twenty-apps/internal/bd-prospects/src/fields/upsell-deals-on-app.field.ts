import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEALS_ON_APP_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: UPSELL_DEALS_ON_APP_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'upsellDeals',
  label: 'Upsell deals',
  description: 'BD deals selling this app to shops on other apps',
  icon: 'IconTrendingUp',
  relationTargetObjectMetadataUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
