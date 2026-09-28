import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_OWNED_SPRINTS_FIELD_UID,
  SPRINT_OWNER_FIELD_UID,
  SPRINT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_OWNED_SPRINTS_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ownedSprints',
  label: 'Owned sprints',
  description: 'Sprints owned by the workspace member',
  icon: 'IconRun',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: SPRINT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: SPRINT_OWNER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
