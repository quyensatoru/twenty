import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  PROJECT_ISSUE_STATUSES_FIELD_UID,
  PROJECT_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  ISSUE_STATUS_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_ISSUE_STATUSES_FIELD_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueStatuses',
  label: "Issue statuses",
  description: "Project's issue statuses",
  icon: 'IconProgressCheck',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_STATUS_PROJECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
