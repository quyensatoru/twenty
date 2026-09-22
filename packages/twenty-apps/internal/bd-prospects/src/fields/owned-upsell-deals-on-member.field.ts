import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OWNED_UPSELL_DEALS_ON_MEMBER_FIELD_UID,
  OWNER_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: OWNED_UPSELL_DEALS_ON_MEMBER_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ownedUpsellDeals',
  label: 'Owned upsell deals',
  icon: 'IconTrendingUp',
  relationTargetObjectMetadataUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    OWNER_ON_UPSELL_DEAL_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
