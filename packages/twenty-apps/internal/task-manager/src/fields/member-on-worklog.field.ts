import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKLOG_MEMBER_FIELD_UID,
  WORKLOG_OBJECT_UID,
  WORKSPACE_MEMBER_WORKLOGS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKLOG_MEMBER_FIELD_UID,
  objectUniversalIdentifier: WORKLOG_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'member',
  label: 'Member',
  description: 'Workspace member who logged the time',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_WORKLOGS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'memberId',
  },
});
