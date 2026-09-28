import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ISSUE_REPORTER_FIELD_UID,
  ISSUE_OBJECT_UID,
  WORKSPACE_MEMBER_REPORTED_ISSUES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_REPORTER_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'reporter',
  label: 'Reporter',
  description: 'Issue reporter',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_REPORTED_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'reporterId',
  },
});
