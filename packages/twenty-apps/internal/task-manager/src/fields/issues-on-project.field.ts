import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  PROJECT_ISSUES_FIELD_UID,
  PROJECT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_ISSUES_FIELD_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: 'Issues',
  description: 'Project's issues',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_PROJECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
