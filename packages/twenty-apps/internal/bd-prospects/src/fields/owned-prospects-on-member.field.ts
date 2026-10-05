import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OWNED_PROSPECTS_ON_MEMBER_FIELD_UID,
  OWNER_ON_PROSPECT_FIELD_UID,
  PROSPECT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: OWNED_PROSPECTS_ON_MEMBER_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ownedProspects',
  label: 'Owned prospects',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier: PROSPECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: OWNER_ON_PROSPECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
