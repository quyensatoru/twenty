import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  SPRINT_ISSUES_FIELD_UID,
  SPRINT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_SPRINT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SPRINT_ISSUES_FIELD_UID,
  objectUniversalIdentifier: SPRINT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: "Issues",
  description: "Sprint's issues",
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_SPRINT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
