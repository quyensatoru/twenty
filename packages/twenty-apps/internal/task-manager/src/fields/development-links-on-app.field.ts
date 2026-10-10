import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_DEVELOPMENT_LINKS_FIELD_UID,
  APP_OBJECT_UID,
  DEVELOPMENT_LINK_APP_FIELD_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_DEVELOPMENT_LINKS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'developmentLinks',
  label: 'Development links',
  description: "App's development links",
  icon: 'IconGitCommit',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    DEVELOPMENT_LINK_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
