import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_DEVELOPMENT_DELIVERIES_FIELD_UID,
  APP_OBJECT_UID,
  DEVELOPMENT_DELIVERY_APP_FIELD_UID,
  DEVELOPMENT_DELIVERY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_DEVELOPMENT_DELIVERIES_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'developmentDeliveries',
  label: 'Development deliveries',
  description: "App's development deliveries",
  icon: 'IconGitCommit',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    DEVELOPMENT_DELIVERY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    DEVELOPMENT_DELIVERY_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
