import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_SPRINTS_VIEW_UID,
  SPRINT_NAME_FIELD_UID,
  SPRINT_OBJECT_UID,
  SPRINT_PROJECT_FIELD_UID,
  SPRINT_START_DATE_FIELD_UID,
  SPRINT_STATE_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_SPRINTS_VIEW_UID,
  name: 'Sprints',
  objectUniversalIdentifier: SPRINT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconRun',
  position: 0,
  fields: [
    {
      universalIdentifier: '3b94bb44-0482-4671-aa8e-f34901b285c2',
      fieldMetadataUniversalIdentifier: SPRINT_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '0faeb530-1b7e-466c-8f28-05959cdf65b5',
      fieldMetadataUniversalIdentifier: SPRINT_STATE_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '6304511a-b87a-4ae5-b268-f66b67cc1436',
      fieldMetadataUniversalIdentifier: SPRINT_PROJECT_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '77ae7a6b-74b3-4870-a43d-faddbe08305a',
      fieldMetadataUniversalIdentifier: SPRINT_START_DATE_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'a6de3ab2-cfbe-4b38-8f9f-7d75ca23b36d',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: SPRINT_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 4,
      isVisible: true,
      size: 150,
    },
  ],
});
