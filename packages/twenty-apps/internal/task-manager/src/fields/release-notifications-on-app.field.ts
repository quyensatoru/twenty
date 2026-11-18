import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_RELEASE_NOTIFICATIONS_FIELD_UID,
  RELEASE_NOTIFICATION_APP_FIELD_UID,
  RELEASE_NOTIFICATION_OBJECT_UID,
} from '../constants/release-notification';
import { APP_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_RELEASE_NOTIFICATIONS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'releaseNotifications',
  label: 'Release notifications',
  description: 'Release notes announced in this app',
  icon: 'IconSpeakerphone',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    RELEASE_NOTIFICATION_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    RELEASE_NOTIFICATION_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
