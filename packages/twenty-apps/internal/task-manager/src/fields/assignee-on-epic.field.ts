import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  EPIC_ASSIGNEE_FIELD_UID,
  EPIC_OBJECT_UID,
  WORKSPACE_MEMBER_ASSIGNED_EPICS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: EPIC_ASSIGNEE_FIELD_UID,
  objectUniversalIdentifier: EPIC_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'assignee',
  label: 'Assignee',
  description: 'Epic assignee',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_ASSIGNED_EPICS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'assigneeId',
  },
});
