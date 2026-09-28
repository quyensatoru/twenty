import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  EPIC_ISSUES_FIELD_UID,
  EPIC_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_EPIC_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: EPIC_ISSUES_FIELD_UID,
  objectUniversalIdentifier: EPIC_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: "Issues",
  description: "Epic's issues",
  icon: 'IconLayoutKanban',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_EPIC_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
