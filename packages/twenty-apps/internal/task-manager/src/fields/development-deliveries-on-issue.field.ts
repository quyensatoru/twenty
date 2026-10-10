import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  DEVELOPMENT_DELIVERY_ISSUE_FIELD_UID,
  DEVELOPMENT_DELIVERY_OBJECT_UID,
  ISSUE_DEVELOPMENT_DELIVERIES_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_DEVELOPMENT_DELIVERIES_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'developmentDeliveries',
  label: 'Development deliveries',
  description: "Issue's linked branches, commits and pull requests",
  icon: 'IconGitCommit',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    DEVELOPMENT_DELIVERY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    DEVELOPMENT_DELIVERY_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
