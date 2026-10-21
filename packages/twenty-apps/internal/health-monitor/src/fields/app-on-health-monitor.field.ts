import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_HEALTH_MONITORS_FIELD_UID,
  APP_OBJECT_UID,
  HEALTH_MONITOR_APP_FIELD_UID,
  HEALTH_MONITOR_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: HEALTH_MONITOR_APP_FIELD_UID,
  objectUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'Task Manager app this monitor watches',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_HEALTH_MONITORS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'appId',
  },
});
