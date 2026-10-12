import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_NOTIFICATION_OBJECT_UID,
  ISSUE_NOTIFICATION_RECIPIENT_ID_FIELD_UID,
  ISSUE_NOTIFICATION_ACTOR_ID_FIELD_UID,
  ISSUE_NOTIFICATION_COMMENT_ID_FIELD_UID,
  ISSUE_NOTIFICATION_BODY_FIELD_UID,
  ISSUE_NOTIFICATION_READ_AT_FIELD_UID,
} from '../constants/discussion';

export default defineObject({
  universalIdentifier: ISSUE_NOTIFICATION_OBJECT_UID,
  nameSingular: 'issueNotification',
  namePlural: 'issueNotifications',
  labelSingular: 'Issue Notification',
  labelPlural: 'Issue Notifications',
  description: 'Task discussion issue notification',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_NOTIFICATION_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: ISSUE_NOTIFICATION_RECIPIENT_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'recipientId',
      label: 'Recipient Id',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_NOTIFICATION_ACTOR_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'actorId',
      label: 'Actor Id',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_NOTIFICATION_COMMENT_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'commentId',
      label: 'Comment Id',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_NOTIFICATION_BODY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'body',
      label: 'Body',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_NOTIFICATION_READ_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'readAt',
      label: 'Read At',
      isNullable: true,
      icon: 'IconMessage',
    },
  ],
});
