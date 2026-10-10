import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  PROJECT_OBJECT_UID,
  PROJECT_REPOSITORIES_FIELD_UID,
  REPOSITORY_OBJECT_UID,
  REPOSITORY_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_REPOSITORIES_FIELD_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'repositories',
  label: 'Repositories',
  description: "Project's git repositories",
  icon: 'IconGitBranch',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: REPOSITORY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: REPOSITORY_PROJECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
