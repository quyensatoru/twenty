import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_PARENT_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_CHILDREN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_PARENT_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'parent',
  label: 'Parent issue',
  description: 'Parent issue (epic link for a story, story for a subtask)',
  icon: 'IconArrowUpRight',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_CHILDREN_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'parentId',
  },
});
