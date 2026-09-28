import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_WORKLOGS_VIEW_UID,
  WORKLOG_DESCRIPTION_FIELD_UID,
  WORKLOG_ISSUE_FIELD_UID,
  WORKLOG_OBJECT_UID,
  WORKLOG_STARTED_AT_FIELD_UID,
  WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_WORKLOGS_VIEW_UID,
  name: 'Worklogs',
  objectUniversalIdentifier: WORKLOG_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconClock',
  position: 0,
  fields: [
    {
      universalIdentifier: '14b65a15-a8df-4cc3-9340-118b1badfaef',
      fieldMetadataUniversalIdentifier: WORKLOG_DESCRIPTION_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: 'fc0d56d9-26ac-4b44-8fd6-7139d1d0ab47',
      fieldMetadataUniversalIdentifier: WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '98358932-eac0-4037-a1c8-94862f584231',
      fieldMetadataUniversalIdentifier: WORKLOG_STARTED_AT_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '26c9f4de-8597-44ab-bf2f-5101c0a0011b',
      fieldMetadataUniversalIdentifier: WORKLOG_ISSUE_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '57235a05-7ce3-4b67-ad66-026b1a174306',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: WORKLOG_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 4,
      isVisible: true,
      size: 150,
    },
  ],
});
