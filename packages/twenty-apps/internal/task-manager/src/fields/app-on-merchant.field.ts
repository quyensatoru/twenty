import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  MERCHANT_APP_FIELD_UID,
  MERCHANT_OBJECT_UID,
  APP_OBJECT_UID,
  APP_MERCHANTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_APP_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'Merchant's app',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_MERCHANTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
