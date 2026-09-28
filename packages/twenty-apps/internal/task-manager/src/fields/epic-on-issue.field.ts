import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_EPIC_FIELD_UID,
  ISSUE_OBJECT_UID,
  EPIC_OBJECT_UID,
  EPIC_ISSUES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_EPIC_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'epic',
  label: 'Epic',
  description: 'Issue's epic',
  icon: 'IconStack2',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: EPIC_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: EPIC_ISSUES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'epicId',
  },
});
