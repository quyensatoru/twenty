import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  DISCOUNT_OBJECT_UID,
  DISCOUNT_SYNC_LOG_DISCOUNT_FIELD_UID,
  DISCOUNT_SYNC_LOG_OBJECT_UID,
  DISCOUNT_SYNC_LOGS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DISCOUNT_SYNC_LOGS_FIELD_UID,
  objectUniversalIdentifier: DISCOUNT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'syncLogs',
  label: 'Deliveries',
  description: 'Each time the discount was sent to its app',
  icon: 'IconCloudUpload',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: DISCOUNT_SYNC_LOG_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    DISCOUNT_SYNC_LOG_DISCOUNT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
