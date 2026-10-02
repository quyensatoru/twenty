import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ISSUE_HISTORY_AUTHOR_FIELD_UID,
  ISSUE_HISTORY_OBJECT_UID,
  WORKSPACE_MEMBER_ISSUE_HISTORIES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_ISSUE_HISTORIES_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'issueHistories',
  label: 'Issue histories',
  description: 'Issue history entries authored by the workspace member',
  icon: 'IconHistory',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_HISTORY_AUTHOR_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
