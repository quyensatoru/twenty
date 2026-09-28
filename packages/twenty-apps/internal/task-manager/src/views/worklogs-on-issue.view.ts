import {
  defineView,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  WORKLOG_DESCRIPTION_FIELD_UID,
  WORKLOG_MEMBER_FIELD_UID,
  WORKLOG_OBJECT_UID,
  WORKLOG_STARTED_AT_FIELD_UID,
  WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
  WORKLOGS_ON_ISSUE_VIEW_UID,
} from '../constants/universal-identifiers';

// Backs the Worklogs widget on the issue record page.
export default defineView({
  universalIdentifier: WORKLOGS_ON_ISSUE_VIEW_UID,
  name: 'Worklogs',
  objectUniversalIdentifier: WORKLOG_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconClock',
  position: 1,
  fields: [
    {
      universalIdentifier: '9d2c8b43-92b9-49fc-89f5-b8baf7ba4868',
      fieldMetadataUniversalIdentifier: WORKLOG_DESCRIPTION_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier: '503aadf2-cc99-4db6-8265-8d9b98cc4d8e',
      fieldMetadataUniversalIdentifier: WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'f6155525-7791-4e69-b1f5-58c05a612f3d',
      fieldMetadataUniversalIdentifier: WORKLOG_STARTED_AT_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'd433f5ea-508a-492e-ad93-a441a15f0ada',
      fieldMetadataUniversalIdentifier: WORKLOG_MEMBER_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 180,
    },
  ],
  sorts: [
    {
      universalIdentifier: '9a598ae5-b801-4d62-a8a5-a0cdbd01bae3',
      fieldMetadataUniversalIdentifier: WORKLOG_STARTED_AT_FIELD_UID,
      direction: ViewSortDirection.DESC,
    },
  ],
});
