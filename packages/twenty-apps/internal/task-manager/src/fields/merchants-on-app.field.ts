import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_MERCHANTS_FIELD_UID,
  APP_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  MERCHANT_APP_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_MERCHANTS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchants',
  label: 'Merchants',
  description: 'Merchants using this app',
  icon: 'IconBuildingStore',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MERCHANT_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
