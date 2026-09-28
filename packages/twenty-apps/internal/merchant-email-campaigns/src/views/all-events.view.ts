import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  ALL_EVENTS_VIEW_UID,
  MERCHANT_EVENT_CAMPAIGNS_QUEUED_FIELD_UID,
  MERCHANT_EVENT_DOMAIN_FIELD_UID,
  MERCHANT_EVENT_EMAIL_FIELD_UID,
  MERCHANT_EVENT_NAME_FIELD_UID,
  MERCHANT_EVENT_OBJECT_UID,
  MERCHANT_EVENT_OCCURRED_AT_FIELD_UID,
  MERCHANT_EVENT_STATUS_FIELD_UID,
  MERCHANT_ON_EVENT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_EVENTS_VIEW_UID,
  name: 'Events',
  objectUniversalIdentifier: MERCHANT_EVENT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconBroadcast',
  position: 0,
  fields: [
    {
      universalIdentifier: '67792d53-97a6-4bf2-9f22-5561ae768f4b',
      fieldMetadataUniversalIdentifier: MERCHANT_EVENT_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '55270b0d-b0bb-4763-8129-58fa2615f738',
      fieldMetadataUniversalIdentifier: MERCHANT_EVENT_STATUS_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '74b28edc-3e73-43b3-8ff6-5dc20878e725',
      fieldMetadataUniversalIdentifier: MERCHANT_ON_EVENT_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'c5371439-e941-40db-8772-4d703d9ca650',
      fieldMetadataUniversalIdentifier: MERCHANT_EVENT_EMAIL_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '496e657f-6503-4bf3-ab06-23648039eb43',
      fieldMetadataUniversalIdentifier: MERCHANT_EVENT_DOMAIN_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'a1a0cfb9-5afa-43a4-b9b3-163fb119780a',
      fieldMetadataUniversalIdentifier:
        MERCHANT_EVENT_CAMPAIGNS_QUEUED_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '48a773ff-de58-45af-8070-2781f8ea4323',
      fieldMetadataUniversalIdentifier: MERCHANT_EVENT_OCCURRED_AT_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 170,
    },
  ],
  sorts: [
    {
      universalIdentifier: '2251290d-94b2-4e79-a29d-f86792ab4e0d',
      fieldMetadataUniversalIdentifier: MERCHANT_EVENT_OCCURRED_AT_FIELD_UID,
      direction: ViewSortDirection.DESC,
    },
  ],
});
