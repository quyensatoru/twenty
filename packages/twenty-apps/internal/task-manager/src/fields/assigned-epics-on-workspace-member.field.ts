import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_ASSIGNED_EPICS_FIELD_UID,
  EPIC_ASSIGNEE_FIELD_UID,
  EPIC_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_ASSIGNED_EPICS_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'assignedEpics',
  label: 'Assigned epics',
  description: 'Epics assigned to the workspace member',
  icon: 'IconStack2',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: EPIC_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: EPIC_ASSIGNEE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
