import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_PROJECTS_FIELD_UID,
  APP_OBJECT_UID,
  PROJECT_OBJECT_UID,
  PROJECT_APP_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_PROJECTS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'projects',
  label: "Projects",
  description: "App's projects",
  icon: 'IconListDetails',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
