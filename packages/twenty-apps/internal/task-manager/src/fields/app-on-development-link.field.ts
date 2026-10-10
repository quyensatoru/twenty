import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_DEVELOPMENT_LINKS_FIELD_UID,
  APP_OBJECT_UID,
  DEVELOPMENT_LINK_APP_FIELD_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
} from '../constants/universal-identifiers';

// App-scope mirror. See app-on-issue.field.ts: a row-level predicate can only
// compare a field on the record being read, so the app sits on the row.
export default defineField({
  universalIdentifier: DEVELOPMENT_LINK_APP_FIELD_UID,
  objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App this record belongs to, mirrored from its issue',
  icon: 'IconApps',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    APP_DEVELOPMENT_LINKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'appId',
  },
});
