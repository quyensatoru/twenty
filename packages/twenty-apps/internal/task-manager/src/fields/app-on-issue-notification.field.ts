import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_NOTIFICATION_OBJECT_UID,
  ISSUE_NOTIFICATION_APP_FIELD_UID,
  APP_ISSUE_NOTIFICATIONS_FIELD_UID,
} from '../constants/discussion';
import { APP_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_NOTIFICATION_APP_FIELD_UID,
  objectUniversalIdentifier: ISSUE_NOTIFICATION_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  icon: 'IconMessage',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    APP_ISSUE_NOTIFICATIONS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'appId',
  },
});
