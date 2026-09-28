import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  PROJECT_SPRINTS_FIELD_UID,
  PROJECT_OBJECT_UID,
  SPRINT_OBJECT_UID,
  SPRINT_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_SPRINTS_FIELD_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'sprints',
  label: 'Sprints',
  description: 'Project's sprints',
  icon: 'IconRun',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: SPRINT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: SPRINT_PROJECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
