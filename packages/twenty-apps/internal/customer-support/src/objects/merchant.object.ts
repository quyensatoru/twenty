import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_CUSTOM_SETTINGS_FIELD_UID,
  MERCHANT_NAME_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

// Master data two other apps depend on, which is why it lives here rather
// than inside either of them: merchant-email-campaigns owns email,
// contactName and the unsubscribe fields on this object, and task-manager
// owns the app relation and the issue junction. Only the fields intrinsic to
// a merchant are declared here — an app that needs a field adds its own, the
// way merchant-email-campaigns already does.
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
