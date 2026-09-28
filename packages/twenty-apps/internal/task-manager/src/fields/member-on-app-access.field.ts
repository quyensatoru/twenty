import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  APP_ACCESS_MEMBER_FIELD_UID,
  APP_ACCESS_OBJECT_UID,
  WORKSPACE_MEMBER_APP_ACCESSES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ACCESS_MEMBER_FIELD_UID,
  objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'member',
  label: 'Member',
  description: 'Workspace member granted this access',
  icon: 'IconUserCircle',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_APP_ACCESSES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'memberId',
  },
});
