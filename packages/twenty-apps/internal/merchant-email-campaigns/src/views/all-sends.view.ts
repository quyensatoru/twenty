import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  ALL_SENDS_VIEW_UID,
  CAMPAIGN_ON_SEND_FIELD_UID,
  EMAIL_SEND_ERROR_MESSAGE_FIELD_UID,
  EMAIL_SEND_NAME_FIELD_UID,
  EMAIL_SEND_OBJECT_UID,
  EMAIL_SEND_SENT_AT_FIELD_UID,
  EMAIL_SEND_STATUS_FIELD_UID,
  EMAIL_SEND_SUBJECT_FIELD_UID,
  EMAIL_SEND_TRIGGER_FIELD_UID,
  MERCHANT_ON_SEND_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_SENDS_VIEW_UID,
  name: 'Sends',
  objectUniversalIdentifier: EMAIL_SEND_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconMailForward',
  position: 0,
  fields: [
    {
      universalIdentifier: '986f42b8-7992-49ae-9005-692d7aed3da3',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '4d167532-40f6-4193-8374-4a4eb8cdd141',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_STATUS_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'e6482e90-a230-4048-9bc1-dc81c99e77e0',
      fieldMetadataUniversalIdentifier: CAMPAIGN_ON_SEND_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '3d21c355-8151-44e4-9f3d-4536ba3765e4',
      fieldMetadataUniversalIdentifier: MERCHANT_ON_SEND_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '3d43810d-2647-4935-80c3-89e35182b0bc',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_SUBJECT_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: '3567d3d7-c610-4a37-829d-1ce0418b74be',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_TRIGGER_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'e09c5545-035e-456a-884e-a3d5f8a96e1b',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_SENT_AT_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '472b8aaf-8c8c-4913-a42f-27634d6b41ea',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_ERROR_MESSAGE_FIELD_UID,
      position: 7,
      isVisible: true,
      size: 240,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'ebb36e35-4c4b-4ae2-91f7-7983da1fcd10',
      fieldMetadataUniversalIdentifier: EMAIL_SEND_SENT_AT_FIELD_UID,
      direction: ViewSortDirection.DESC,
    },
  ],
});
