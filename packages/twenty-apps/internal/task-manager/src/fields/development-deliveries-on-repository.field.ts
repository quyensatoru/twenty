import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  DEVELOPMENT_DELIVERY_OBJECT_UID,
  DEVELOPMENT_DELIVERY_REPOSITORY_FIELD_UID,
  REPOSITORY_DEVELOPMENT_DELIVERIES_FIELD_UID,
  REPOSITORY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: REPOSITORY_DEVELOPMENT_DELIVERIES_FIELD_UID,
  objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'developmentDeliveries',
  label: 'Development deliveries',
  description: "Repository's linked branches, commits and pull requests",
  icon: 'IconGitCommit',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    DEVELOPMENT_DELIVERY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    DEVELOPMENT_DELIVERY_REPOSITORY_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
