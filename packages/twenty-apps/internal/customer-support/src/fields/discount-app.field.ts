import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_DISCOUNTS_FIELD_UID,
  APP_OBJECT_UID,
  DISCOUNT_APP_FIELD_UID,
  DISCOUNT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DISCOUNT_APP_FIELD_UID,
  objectUniversalIdentifier: DISCOUNT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App whose plans the code discounts',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_DISCOUNTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
