import { defineIndex } from 'twenty-sdk/define';

import {
  HEALTH_SNAPSHOT_MONITOR_FIELD_UID,
  HEALTH_SNAPSHOT_MONITOR_POLLED_INDEX_MONITOR_FIELD_UID,
  HEALTH_SNAPSHOT_MONITOR_POLLED_INDEX_POLLED_FIELD_UID,
  HEALTH_SNAPSHOT_MONITOR_POLLED_INDEX_UID,
  HEALTH_SNAPSHOT_OBJECT_UID,
  HEALTH_SNAPSHOT_POLLED_AT_FIELD_UID,
} from '../constants/universal-identifiers';

// Every chart and the cleanup read snapshots by monitor and time window.
export default defineIndex({
  universalIdentifier: HEALTH_SNAPSHOT_MONITOR_POLLED_INDEX_UID,
  objectUniversalIdentifier: HEALTH_SNAPSHOT_OBJECT_UID,
  fields: [
    {
      universalIdentifier:
        HEALTH_SNAPSHOT_MONITOR_POLLED_INDEX_MONITOR_FIELD_UID,
      fieldUniversalIdentifier: HEALTH_SNAPSHOT_MONITOR_FIELD_UID,
    },
    {
      universalIdentifier:
        HEALTH_SNAPSHOT_MONITOR_POLLED_INDEX_POLLED_FIELD_UID,
      fieldUniversalIdentifier: HEALTH_SNAPSHOT_POLLED_AT_FIELD_UID,
    },
  ],
});
