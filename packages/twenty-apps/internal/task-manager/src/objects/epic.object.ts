import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  EPIC_NAME_FIELD_UID,
  EPIC_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineObject({
  universalIdentifier: EPIC_OBJECT_UID,
  nameSingular: 'epic',
  namePlural: 'epics',
  labelSingular: 'Epic',
  labelPlural: 'Epics',
  description: 'An epic',
  icon: 'IconStack2',
  labelIdentifierFieldMetadataUniversalIdentifier: EPIC_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: EPIC_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Epic name',
      icon: 'IconStack2',
      isNullable: true,
    },
  ],
});
