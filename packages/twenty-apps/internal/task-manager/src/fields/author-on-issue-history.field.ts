import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ISSUE_HISTORY_AUTHOR_FIELD_UID,
  ISSUE_HISTORY_OBJECT_UID,
  WORKSPACE_MEMBER_ISSUE_HISTORIES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_HISTORY_AUTHOR_FIELD_UID,
  objectUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'author',
  label: 'Author',
  description: 'Workspace member behind the change, if a person made it',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_ISSUE_HISTORIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'authorId',
  },
});
