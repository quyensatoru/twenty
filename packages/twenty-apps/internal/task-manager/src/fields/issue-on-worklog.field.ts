import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  WORKLOG_ISSUE_FIELD_UID,
  WORKLOG_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_WORKLOGS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKLOG_ISSUE_FIELD_UID,
  objectUniversalIdentifier: WORKLOG_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  description: 'Logged issue',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_WORKLOGS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
