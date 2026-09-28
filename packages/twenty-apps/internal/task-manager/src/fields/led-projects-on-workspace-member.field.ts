import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_LED_PROJECTS_FIELD_UID,
  PROJECT_LEAD_FIELD_UID,
  PROJECT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_LED_PROJECTS_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ledProjects',
  label: 'Led projects',
  description: 'Projects led by the workspace member',
  icon: 'IconListDetails',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_LEAD_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
