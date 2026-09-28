import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  SPRINT_OWNER_FIELD_UID,
  SPRINT_OBJECT_UID,
  WORKSPACE_MEMBER_OWNED_SPRINTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SPRINT_OWNER_FIELD_UID,
  objectUniversalIdentifier: SPRINT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Owner',
  description: 'Sprint owner',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_OWNED_SPRINTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
