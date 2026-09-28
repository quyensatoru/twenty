import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_STATUS_PROJECT_FIELD_UID,
  ISSUE_STATUS_OBJECT_UID,
  PROJECT_OBJECT_UID,
  PROJECT_ISSUE_STATUSES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_STATUS_PROJECT_FIELD_UID,
  objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'project',
  label: 'Project',
  description: 'Project this status belongs to',
  icon: 'IconListDetails',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_ISSUE_STATUSES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'projectId',
  },
});
