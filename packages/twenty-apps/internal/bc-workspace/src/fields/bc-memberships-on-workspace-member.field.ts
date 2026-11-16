import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_MEMBER_MEMBER_FIELD_UID,
  BC_MEMBER_OBJECT_UID,
  WORKSPACE_MEMBER_BC_MEMBERSHIPS_FIELD_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_BC_MEMBERSHIPS_FIELD_UID,
  objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'bcMemberships',
  label: 'BC memberships',
  description: 'BC team memberships',
  icon: 'IconUserStar',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_MEMBER_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_MEMBER_MEMBER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
