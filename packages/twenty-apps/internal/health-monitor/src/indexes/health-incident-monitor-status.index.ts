import { defineIndex } from 'twenty-sdk/define';

import {
  HEALTH_INCIDENT_MONITOR_FIELD_UID,
  HEALTH_INCIDENT_MONITOR_STATUS_INDEX_MONITOR_FIELD_UID,
  HEALTH_INCIDENT_MONITOR_STATUS_INDEX_STATUS_FIELD_UID,
  HEALTH_INCIDENT_MONITOR_STATUS_INDEX_UID,
  HEALTH_INCIDENT_OBJECT_UID,
  HEALTH_INCIDENT_STATUS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: HEALTH_INCIDENT_MONITOR_STATUS_INDEX_UID,
  objectUniversalIdentifier: HEALTH_INCIDENT_OBJECT_UID,
  fields: [
    {
      universalIdentifier:
        HEALTH_INCIDENT_MONITOR_STATUS_INDEX_MONITOR_FIELD_UID,
      fieldUniversalIdentifier: HEALTH_INCIDENT_MONITOR_FIELD_UID,
    },
    {
      universalIdentifier:
        HEALTH_INCIDENT_MONITOR_STATUS_INDEX_STATUS_FIELD_UID,
      fieldUniversalIdentifier: HEALTH_INCIDENT_STATUS_FIELD_UID,
    },
  ],
});
