import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_ISSUES_FIELD_UID,
  APP_OBJECT_UID,
  ISSUE_APP_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

// Denormalised: the truth is still `issue -> project -> app`. A row-level
// permission predicate can only compare a field on the record being read, so
// the app has to sit on the issue row itself for the engine to filter on it.
// sync-app-scope-mirror keeps it in step; nothing should edit it by hand.
export default defineField({
  universalIdentifier: ISSUE_APP_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App the issue belongs to, mirrored from its project',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
