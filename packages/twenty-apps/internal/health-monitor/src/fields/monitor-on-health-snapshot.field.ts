import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  HEALTH_MONITOR_OBJECT_UID,
  HEALTH_MONITOR_SNAPSHOTS_FIELD_UID,
  HEALTH_SNAPSHOT_MONITOR_FIELD_UID,
  HEALTH_SNAPSHOT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: HEALTH_SNAPSHOT_MONITOR_FIELD_UID,
  objectUniversalIdentifier: HEALTH_SNAPSHOT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'monitor',
  label: 'Monitor',
  icon: 'IconHeartRateMonitor',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_MONITOR_SNAPSHOTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'monitorId',
  },
});
