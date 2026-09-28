import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_STATUS_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  ISSUE_STATUS_ISSUES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_STATUS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'status',
  label: 'Status',
  description: 'Issue status',
  icon: 'IconProgressCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_STATUS_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'statusId',
  },
});
