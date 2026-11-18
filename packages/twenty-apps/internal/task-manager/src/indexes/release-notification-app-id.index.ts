import { defineIndex } from 'twenty-sdk/define';

import {
  RELEASE_NOTIFICATION_APP_FIELD_UID,
  RELEASE_NOTIFICATION_APP_ID_INDEX_FIELD_UID,
  RELEASE_NOTIFICATION_APP_ID_INDEX_UID,
  RELEASE_NOTIFICATION_OBJECT_UID,
} from '../constants/release-notification';

export default defineIndex({
  universalIdentifier: RELEASE_NOTIFICATION_APP_ID_INDEX_UID,
  objectUniversalIdentifier: RELEASE_NOTIFICATION_OBJECT_UID,
  fields: [
    {
      universalIdentifier: RELEASE_NOTIFICATION_APP_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: RELEASE_NOTIFICATION_APP_FIELD_UID,
    },
  ],
});
