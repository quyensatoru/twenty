import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  APP_REPOSITORIES_FIELD_UID,
  REPOSITORY_APP_FIELD_UID,
  REPOSITORY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_REPOSITORIES_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'repositories',
  label: 'Repositories',
  description: "App's git repositories",
  icon: 'IconGitBranch',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: REPOSITORY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: REPOSITORY_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
