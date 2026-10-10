import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  DEVELOPMENT_LINK_ISSUE_FIELD_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
  ISSUE_DEVELOPMENT_LINKS_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DEVELOPMENT_LINK_ISSUE_FIELD_UID,
  objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  description: 'Issue this development link belongs to',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_DEVELOPMENT_LINKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
