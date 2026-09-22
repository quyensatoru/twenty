import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MERCHANT_OBJECT_UID,
  MERCHANTS_ON_PROSPECT_FIELD_UID,
  PROSPECT_OBJECT_UID,
  PROSPECT_ON_MERCHANT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANTS_ON_PROSPECT_FIELD_UID,
  objectUniversalIdentifier: PROSPECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchants',
  label: 'Merchants',
  description: 'Per-app merchant records this shop has in the portal',
  icon: 'IconBuildingStore',
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    PROSPECT_ON_MERCHANT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
