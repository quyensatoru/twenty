import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  PROJECT_LEAD_FIELD_UID,
  PROJECT_OBJECT_UID,
  WORKSPACE_MEMBER_LED_PROJECTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_LEAD_FIELD_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'lead',
  label: 'Lead',
  description: 'Project lead',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_LED_PROJECTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'leadId',
  },
});
