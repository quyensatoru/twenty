import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  HEALTH_INCIDENT_MONITOR_FIELD_UID,
  HEALTH_INCIDENT_OBJECT_UID,
  HEALTH_MONITOR_INCIDENTS_FIELD_UID,
  HEALTH_MONITOR_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: HEALTH_INCIDENT_MONITOR_FIELD_UID,
  objectUniversalIdentifier: HEALTH_INCIDENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'monitor',
  label: 'Monitor',
  icon: 'IconHeartRateMonitor',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_MONITOR_INCIDENTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'monitorId',
  },
});
