import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_SPRINTS_FIELD_UID,
  APP_OBJECT_UID,
  SPRINT_APP_FIELD_UID,
  SPRINT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_SPRINTS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'sprints',
  label: 'Sprints',
  description: 'Sprints belonging to this app',
  icon: 'IconRun',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: SPRINT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: SPRINT_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
