import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_SPRINT_FIELD_UID,
  ISSUE_OBJECT_UID,
  SPRINT_OBJECT_UID,
  SPRINT_ISSUES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_SPRINT_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'sprint',
  label: "Sprint",
  description: "Issue's sprint (null = backlog)",
  icon: 'IconRun',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: SPRINT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: SPRINT_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'sprintId',
  },
});
