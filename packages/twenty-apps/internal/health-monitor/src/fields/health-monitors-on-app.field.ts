import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_HEALTH_MONITORS_FIELD_UID,
  APP_OBJECT_UID,
  HEALTH_MONITOR_APP_FIELD_UID,
  HEALTH_MONITOR_OBJECT_UID,
} from '../constants/universal-identifiers';

// Declared here rather than in Task Manager, so Task Manager stays
// installable without the health monitor.
export default defineField({
  universalIdentifier: APP_HEALTH_MONITORS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'healthMonitors',
  label: 'Health monitors',
  description: 'Health monitor of this app (one at most)',
  icon: 'IconHeartRateMonitor',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: HEALTH_MONITOR_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
