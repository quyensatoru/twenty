import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  PROJECT_EPICS_FIELD_UID,
  PROJECT_OBJECT_UID,
  EPIC_OBJECT_UID,
  EPIC_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_EPICS_FIELD_UID,
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'epics',
  label: 'Epics',
  description: 'Project's epics',
  icon: 'IconStack2',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: EPIC_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: EPIC_PROJECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
