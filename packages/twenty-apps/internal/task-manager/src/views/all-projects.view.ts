import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_PROJECTS_VIEW_UID,
  PROJECT_CATEGORY_FIELD_UID,
  PROJECT_KEY_FIELD_UID,
  PROJECT_LEAD_FIELD_UID,
  PROJECT_NAME_FIELD_UID,
  PROJECT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_PROJECTS_VIEW_UID,
  name: 'Projects',
  objectUniversalIdentifier: PROJECT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconListDetails',
  position: 0,
  fields: [
    {
      universalIdentifier: '613a56b6-1333-44ff-8c9e-58de505f364e',
      fieldMetadataUniversalIdentifier: PROJECT_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '3eb1b17d-6e64-4bb3-9e9d-744686a35f27',
      fieldMetadataUniversalIdentifier: PROJECT_KEY_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '0149dafc-57d5-4404-a96c-2914674215f1',
      fieldMetadataUniversalIdentifier: PROJECT_CATEGORY_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '389e10c5-a900-459b-9230-497f39c903d1',
      fieldMetadataUniversalIdentifier: PROJECT_LEAD_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '18a2db4a-c50e-4169-9ce5-7e2ac4690e2a',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: PROJECT_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 4,
      isVisible: true,
      size: 150,
    },
  ],
});
