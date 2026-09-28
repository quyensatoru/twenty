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
      universalIdentifier: '3d94b8e0-8818-4b34-be96-6d545335623f',
      fieldMetadataUniversalIdentifier: WORKLOG_DESCRIPTION_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier: '464950bb-b3d8-4074-8ac2-0c6dcb6b8c18',
      fieldMetadataUniversalIdentifier: WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '2132c185-a07b-4c97-9c39-f089b053e9e3',
      fieldMetadataUniversalIdentifier: WORKLOG_STARTED_AT_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'b56b0efd-24ba-4fd9-81db-274358900571',
      fieldMetadataUniversalIdentifier: WORKLOG_MEMBER_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 180,
    },
  ],
  sorts: [
    {
      universalIdentifier: '734cb4e8-1c37-46fb-bd24-a112a3beab16',
      fieldMetadataUniversalIdentifier: WORKLOG_STARTED_AT_FIELD_UID,
      direction: ViewSortDirection.DESC,
    },
  ],
});
