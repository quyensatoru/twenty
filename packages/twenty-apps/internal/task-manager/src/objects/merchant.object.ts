import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_CUSTOM_SETTINGS_FIELD_UID,
  MERCHANT_NAME_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

// The merchant-email-campaigns app owns its own fields on this object (email,
// contactName, emailUnsubscribed, emailUnsubscribedAt and its relations). Only
// the fields this app brought over from the fork are declared here.
export default defineObject({
  universalIdentifier: MERCHANT_OBJECT_UID,
  nameSingular: 'merchant',
  namePlural: 'merchants',
  labelSingular: 'Merchant',
  labelPlural: 'Merchants',
  description: 'A merchant',
  icon: 'IconBuildingStore',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: MERCHANT_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: MERCHANT_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Merchant name',
      icon: 'IconBuildingStore',
      isNullable: true,
    },
    {
      universalIdentifier: MERCHANT_CUSTOM_SETTINGS_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'customSettings',
      label: 'Custom Settings',
      description:
        'Custom feature settings for this merchant, shape varies by app',
      icon: 'IconSettings',
      isNullable: true,
    },
  ],
});
