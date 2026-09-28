import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_ISSUE_STATUSES_VIEW_UID,
  ISSUE_STATUS_NAME_FIELD_UID,
  ISSUE_STATUS_OBJECT_UID,
  ISSUE_STATUS_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_ISSUE_STATUSES_VIEW_UID,
  name: 'Issue Statuses',
  objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconProgressCheck',
  position: 0,
  fields: [
    {
      universalIdentifier: 'a0f55cae-32ba-46b8-bd3b-93512276306a',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'f0c417c0-a277-45ea-ae68-bdf9a7bc63fc',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_PROJECT_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '5e9fd162-35ef-4197-b4ae-2e9c9899c483',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 2,
      isVisible: true,
      size: 150,
    },
  ],
});
