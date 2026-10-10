import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  DEVELOPMENT_LINK_OBJECT_UID,
  DEVELOPMENT_LINK_REPOSITORY_FIELD_UID,
  REPOSITORY_DEVELOPMENT_LINKS_FIELD_UID,
  REPOSITORY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: REPOSITORY_DEVELOPMENT_LINKS_FIELD_UID,
  objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'developmentLinks',
  label: 'Development links',
  description: "Repository's linked branches, commits and pull requests",
  icon: 'IconGitCommit',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    DEVELOPMENT_LINK_REPOSITORY_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
