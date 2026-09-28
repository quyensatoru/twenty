import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_STATUS_ISSUES_FIELD_UID,
  ISSUE_STATUS_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_STATUS_ISSUES_FIELD_UID,
  objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: 'Issues',
  description: 'Issues currently in this status',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_STATUS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
