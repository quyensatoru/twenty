import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_EPICS_FIELD_UID,
  APP_OBJECT_UID,
  EPIC_APP_FIELD_UID,
  EPIC_OBJECT_UID,
} from '../constants/universal-identifiers';

// App-scope mirror. See app-on-issue.field.ts: a row-level predicate can only
// compare a field on the record being read, so the app sits on the row.
export default defineField({
  universalIdentifier: EPIC_APP_FIELD_UID,
  objectUniversalIdentifier: EPIC_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App this record belongs to, mirrored from its parent',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_EPICS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
