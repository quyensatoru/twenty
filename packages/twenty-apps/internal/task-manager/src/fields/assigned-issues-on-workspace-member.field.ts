import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_ASSIGNED_ISSUES_FIELD_UID,
  ISSUE_ASSIGNEE_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_ASSIGNED_ISSUES_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'assignedIssues',
  label: 'Assigned issues',
  description: 'Issues assigned to the workspace member',
  icon: 'IconLayoutKanban',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_ASSIGNEE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
