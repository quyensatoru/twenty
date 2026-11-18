import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_RELEASE_NOTIFICATIONS_FIELD_UID,
  RELEASE_NOTIFICATION_APP_FIELD_UID,
  RELEASE_NOTIFICATION_OBJECT_UID,
} from '../constants/release-notification';
import { APP_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: RELEASE_NOTIFICATION_APP_FIELD_UID,
  objectUniversalIdentifier: RELEASE_NOTIFICATION_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App this release is announced in',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    APP_RELEASE_NOTIFICATIONS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
