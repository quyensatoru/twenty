import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_NOTIFICATION_OBJECT_UID,
  ISSUE_NOTIFICATION_ISSUE_FIELD_UID,
  ISSUE_ISSUE_NOTIFICATIONS_FIELD_UID,
} from '../constants/discussion';
import { ISSUE_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_ISSUE_NOTIFICATIONS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueNotifications',
  label: 'Issue Notifications',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    ISSUE_NOTIFICATION_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_NOTIFICATION_ISSUE_FIELD_UID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
