import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_EPICS_FIELD_UID,
  APP_OBJECT_UID,
  EPIC_APP_FIELD_UID,
  EPIC_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_EPICS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'epics',
  label: 'Epics',
  description: 'Epics belonging to this app',
  icon: 'IconLayoutList',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: EPIC_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: EPIC_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
