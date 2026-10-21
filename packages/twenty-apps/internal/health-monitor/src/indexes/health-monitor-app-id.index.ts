import { defineIndex } from 'twenty-sdk/define';

import {
  HEALTH_MONITOR_APP_FIELD_UID,
  HEALTH_MONITOR_APP_INDEX_FIELD_UID,
  HEALTH_MONITOR_APP_INDEX_UID,
  HEALTH_MONITOR_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: HEALTH_MONITOR_APP_INDEX_UID,
  objectUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  fields: [
    {
      universalIdentifier: HEALTH_MONITOR_APP_INDEX_FIELD_UID,
      fieldUniversalIdentifier: HEALTH_MONITOR_APP_FIELD_UID,
    },
  ],
});
