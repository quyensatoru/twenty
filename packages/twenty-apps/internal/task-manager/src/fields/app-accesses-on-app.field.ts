import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_APP_ACCESSES_FIELD_UID,
  APP_OBJECT_UID,
  APP_ACCESS_OBJECT_UID,
  APP_ACCESS_APP_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_APP_ACCESSES_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'appAccesses',
  label: "App accesses",
  description: "App's access grants",
  icon: 'IconLock',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_ACCESS_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
