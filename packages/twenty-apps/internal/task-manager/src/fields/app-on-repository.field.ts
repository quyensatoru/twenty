import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  APP_REPOSITORIES_FIELD_UID,
  REPOSITORY_APP_FIELD_UID,
  REPOSITORY_OBJECT_UID,
} from '../constants/universal-identifiers';

// App-scope mirror. See app-on-issue.field.ts: a row-level predicate can only
// compare a field on the record being read, so the app sits on the row.
export default defineField({
  universalIdentifier: REPOSITORY_APP_FIELD_UID,
  objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App this record belongs to, mirrored from its project',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_REPOSITORIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
