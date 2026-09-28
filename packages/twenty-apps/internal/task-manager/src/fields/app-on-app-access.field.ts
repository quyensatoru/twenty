import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_ACCESS_APP_FIELD_UID,
  APP_ACCESS_OBJECT_UID,
  APP_OBJECT_UID,
  APP_APP_ACCESSES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ACCESS_APP_FIELD_UID,
  objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  description: 'App this access grant applies to',
  icon: 'IconApps',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_APP_ACCESSES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'appId',
  },
});
