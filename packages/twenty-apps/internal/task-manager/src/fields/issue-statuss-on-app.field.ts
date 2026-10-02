import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_ISSUE_STATUSS_FIELD_UID,
  APP_OBJECT_UID,
  ISSUE_STATUS_APP_FIELD_UID,
  ISSUE_STATUS_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ISSUE_STATUSS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueStatuses',
  label: 'Issue statuses',
  description: 'Issue statuses belonging to this app',
  icon: 'IconProgressCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_STATUS_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
