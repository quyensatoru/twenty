import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_MEMBER_OBJECT_UID,
  BC_MEMBER_TEAM_FIELD_UID,
  BC_TEAM_MEMBERS_FIELD_UID,
  BC_TEAM_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_TEAM_MEMBERS_FIELD_UID,
  objectUniversalIdentifier: BC_TEAM_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'members',
  label: 'Members',
  description: 'Members of the team',
  icon: 'IconUsers',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_MEMBER_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_MEMBER_TEAM_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
