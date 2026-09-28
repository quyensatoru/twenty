import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_EPICS_VIEW_UID,
  EPIC_NAME_FIELD_UID,
  EPIC_OBJECT_UID,
  EPIC_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_EPICS_VIEW_UID,
  name: 'Epics',
  objectUniversalIdentifier: EPIC_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconStack2',
  position: 0,
  fields: [
    {
      universalIdentifier: '2474c6a1-2d5b-4ce6-ac3a-38ff730f7eb5',
      fieldMetadataUniversalIdentifier: EPIC_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: 'f701612f-aa86-4d8b-8849-a2153a4a5f21',
      fieldMetadataUniversalIdentifier: EPIC_PROJECT_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '71f84c2b-4938-4649-a85a-104104a5f773',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: EPIC_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 2,
      isVisible: true,
      size: 150,
    },
  ],
});
