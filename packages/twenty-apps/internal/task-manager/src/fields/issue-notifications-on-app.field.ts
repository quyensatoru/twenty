import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_NOTIFICATION_OBJECT_UID,
  ISSUE_NOTIFICATION_APP_FIELD_UID,
  APP_ISSUE_NOTIFICATIONS_FIELD_UID,
} from '../constants/discussion';
import { APP_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ISSUE_NOTIFICATIONS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueNotifications',
  label: 'Issue Notifications',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    ISSUE_NOTIFICATION_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_NOTIFICATION_APP_FIELD_UID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
