import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  EVENTS_ON_MERCHANT_FIELD_UID,
  MERCHANT_EVENT_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  MERCHANT_ON_EVENT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_ON_EVENT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_EVENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'merchant',
  label: 'Merchant',
  icon: 'IconBuildingStore',
  relationTargetObjectMetadataUniversalIdentifier: MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: EVENTS_ON_MERCHANT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'merchantId',
  },
});
