import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_APP_ACCESSES_FIELD_UID,
  APP_ACCESS_MEMBER_FIELD_UID,
  APP_ACCESS_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_APP_ACCESSES_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'appAccesses',
  label: 'App accesses',
  description: 'App access grants for the workspace member',
  icon: 'IconLock',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_ACCESS_MEMBER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
