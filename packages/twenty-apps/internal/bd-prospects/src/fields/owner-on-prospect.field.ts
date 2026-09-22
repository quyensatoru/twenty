import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OWNED_PROSPECTS_ON_MEMBER_FIELD_UID,
  OWNER_ON_PROSPECT_FIELD_UID,
  PROSPECT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: OWNER_ON_PROSPECT_FIELD_UID,
  objectUniversalIdentifier: PROSPECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Owner',
  description: 'BD member accountable for this shop',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OWNED_PROSPECTS_ON_MEMBER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
