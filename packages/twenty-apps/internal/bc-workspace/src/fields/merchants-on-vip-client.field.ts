import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MERCHANT_OBJECT_UID,
  MERCHANT_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_MERCHANTS_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_MERCHANTS_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchants',
  label: 'App subscriptions',
  description: 'Per-app merchant rows of the shop',
  icon: 'IconApps',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MERCHANT_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
