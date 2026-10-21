import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  HEALTH_MONITOR_OBJECT_UID,
  HEALTH_MONITOR_SNAPSHOTS_FIELD_UID,
  HEALTH_SNAPSHOT_MONITOR_FIELD_UID,
  HEALTH_SNAPSHOT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: HEALTH_MONITOR_SNAPSHOTS_FIELD_UID,
  objectUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'snapshots',
  label: 'Snapshots',
  icon: 'IconCamera',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_SNAPSHOT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_SNAPSHOT_MONITOR_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
