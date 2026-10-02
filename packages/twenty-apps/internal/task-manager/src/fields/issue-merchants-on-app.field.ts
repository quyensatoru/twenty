import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_ISSUE_MERCHANTS_FIELD_UID,
  APP_OBJECT_UID,
  ISSUE_MERCHANT_APP_FIELD_UID,
  ISSUE_MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ISSUE_MERCHANTS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueMerchants',
  label: 'Issue merchants',
  description: 'Issue merchants belonging to this app',
  icon: 'IconBuildingStore',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_MERCHANT_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
