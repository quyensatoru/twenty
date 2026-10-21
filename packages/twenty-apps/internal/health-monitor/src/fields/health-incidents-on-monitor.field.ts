import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  HEALTH_INCIDENT_MONITOR_FIELD_UID,
  HEALTH_INCIDENT_OBJECT_UID,
  HEALTH_MONITOR_INCIDENTS_FIELD_UID,
  HEALTH_MONITOR_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: HEALTH_MONITOR_INCIDENTS_FIELD_UID,
  objectUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'incidents',
  label: 'Incidents',
  icon: 'IconAlertTriangle',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: HEALTH_INCIDENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    HEALTH_INCIDENT_MONITOR_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
