import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_CAMPAIGNS_VIEW_UID,
  EMAIL_CAMPAIGN_EVENT_NAME_FIELD_UID,
  EMAIL_CAMPAIGN_LAST_ERROR_FIELD_UID,
  EMAIL_CAMPAIGN_NAME_FIELD_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_CAMPAIGN_SCHEDULED_AT_FIELD_UID,
  EMAIL_CAMPAIGN_STARTED_AT_FIELD_UID,
  EMAIL_CAMPAIGN_STATUS_FIELD_UID,
  EMAIL_CAMPAIGN_TRIGGER_FIELD_UID,
  EMAIL_CAMPAIGN_TYPE_FIELD_UID,
  TEMPLATE_ON_CAMPAIGN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_CAMPAIGNS_VIEW_UID,
  name: 'Campaigns',
  objectUniversalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconSpeakerphone',
  position: 0,
  fields: [
    {
      universalIdentifier: 'bf32495a-a3cb-4ac6-b897-4be6f1f1670e',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '15fe532e-d62b-4a4a-9590-39bf3fdcc523',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_TYPE_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'e9434699-1ef9-44ce-86ed-fcc4bcb1710d',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_STATUS_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '86d4d79b-9549-4a7a-86c0-b6c653211ee4',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_EVENT_NAME_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 220,
    },
    // Hidden, not removed: the column still holds the routing key of every
    // campaign created before events became data.
    {
      universalIdentifier: '27cdbfdd-a0b5-4f6a-ac6e-594ebc31bd89',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_TRIGGER_FIELD_UID,
      position: 4,
      isVisible: false,
      size: 170,
    },
    {
      universalIdentifier: '0f17ec47-8281-4173-a5aa-cb47219c2315',
      fieldMetadataUniversalIdentifier: TEMPLATE_ON_CAMPAIGN_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '931c7002-b31f-4844-807f-091026163ab0',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_SCHEDULED_AT_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'b8ecc59c-d125-4049-87d0-c52a5fad9f58',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_STARTED_AT_FIELD_UID,
      position: 7,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '2a7f314e-5df4-4075-83e4-ccf6c087f022',
      fieldMetadataUniversalIdentifier: EMAIL_CAMPAIGN_LAST_ERROR_FIELD_UID,
      position: 8,
      isVisible: true,
      size: 220,
    },
  ],
});
