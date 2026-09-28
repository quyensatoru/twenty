import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  EVENTS_ON_MERCHANT_FIELD_UID,
  MERCHANT_EVENT_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  MERCHANT_ON_EVENT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: EVENTS_ON_MERCHANT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchantEvents',
  label: 'Merchant events',
  icon: 'IconBroadcast',
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_EVENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MERCHANT_ON_EVENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
