import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_RELEASE_NOTIFICATIONS_VIEW_UID,
  RELEASE_NOTIFICATION_APP_FIELD_UID,
  RELEASE_NOTIFICATION_CATEGORY_FIELD_UID,
  RELEASE_NOTIFICATION_OBJECT_UID,
  RELEASE_NOTIFICATION_RELEASE_DATE_FIELD_UID,
  RELEASE_NOTIFICATION_STATUS_FIELD_UID,
  RELEASE_NOTIFICATION_TITLE_FIELD_UID,
  RELEASE_NOTIFICATION_VERSION_FIELD_UID,
} from '../constants/release-notification';

export default defineView({
  universalIdentifier: ALL_RELEASE_NOTIFICATIONS_VIEW_UID,
  name: 'Release notifications',
  objectUniversalIdentifier: RELEASE_NOTIFICATION_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconSpeakerphone',
  position: 0,
  fields: [
    {
      universalIdentifier: '2eafa76c-4a3d-419b-92fc-d9571fd11880',
      fieldMetadataUniversalIdentifier: RELEASE_NOTIFICATION_TITLE_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: 'f4c741d9-8454-40d2-a0a4-c19bdb869fc7',
      fieldMetadataUniversalIdentifier: RELEASE_NOTIFICATION_APP_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '8c5be3d4-9d3a-474c-9368-61ed24867bfd',
      fieldMetadataUniversalIdentifier: RELEASE_NOTIFICATION_CATEGORY_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '845aee21-67ad-4120-ab43-34868e53b29d',
      fieldMetadataUniversalIdentifier: RELEASE_NOTIFICATION_VERSION_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: '01d0ebbe-a1da-4cc7-9f50-76de9d7faed6',
      fieldMetadataUniversalIdentifier:
        RELEASE_NOTIFICATION_RELEASE_DATE_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'a600ecea-54b3-4ae6-9266-8d292b3c8183',
      fieldMetadataUniversalIdentifier: RELEASE_NOTIFICATION_STATUS_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 130,
    },
  ],
});
