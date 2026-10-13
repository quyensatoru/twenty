import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_CRISP_CONVERSATIONS_VIEW_UID,
  CRISP_CONVERSATION_APP_NAME_FIELD_UID,
  CRISP_CONVERSATION_LAST_MESSAGE_AT_FIELD_UID,
  CRISP_CONVERSATION_LAST_MESSAGE_EXCERPT_FIELD_UID,
  CRISP_CONVERSATION_MERCHANT_FIELD_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  CRISP_CONVERSATION_SEGMENTS_FIELD_UID,
  CRISP_CONVERSATION_STATUS_FIELD_UID,
  CRISP_CONVERSATION_VISITOR_EMAIL_FIELD_UID,
  CRISP_CONVERSATION_VISITOR_NAME_FIELD_UID,
  CRISP_CONVERSATION_WAITING_SINCE_FIELD_UID,
} from '../constants/universal-identifiers';

const COLUMNS = [
  {
    universalIdentifier: 'e96efe46-3e85-457c-a933-fed9478196f3',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_VISITOR_NAME_FIELD_UID,
    size: 200,
  },
  {
    universalIdentifier: 'bb70e1e6-1de4-4ec4-a76a-b89169883660',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_MERCHANT_FIELD_UID,
    size: 220,
  },
  {
    universalIdentifier: '82754ba6-7aee-4cc6-9295-c4d3c37733ca',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_APP_NAME_FIELD_UID,
    size: 90,
  },
  {
    universalIdentifier: '7e995b8e-861e-42b7-a3b2-3bfc59ee3f3f',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_STATUS_FIELD_UID,
    size: 120,
  },
  {
    universalIdentifier: 'fef429da-7d33-4b1b-8ed0-18b9e4744edc',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_WAITING_SINCE_FIELD_UID,
    size: 150,
  },
  {
    universalIdentifier: '7a5a64e3-574d-49fc-a206-d364d57e328f',
    fieldMetadataUniversalIdentifier:
      CRISP_CONVERSATION_LAST_MESSAGE_EXCERPT_FIELD_UID,
    size: 320,
  },
  {
    universalIdentifier: '1151590c-06d7-4ea7-bafb-c8df2c7c56b6',
    fieldMetadataUniversalIdentifier:
      CRISP_CONVERSATION_LAST_MESSAGE_AT_FIELD_UID,
    size: 150,
  },
  {
    universalIdentifier: '2791f6e0-fc68-4a1d-a595-51ca7ce2f4cc',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_SEGMENTS_FIELD_UID,
    size: 200,
  },
  {
    universalIdentifier: 'f456dea5-ac94-470c-a68c-5e6d34b5e178',
    fieldMetadataUniversalIdentifier: CRISP_CONVERSATION_VISITOR_EMAIL_FIELD_UID,
    size: 220,
  },
];

export default defineView({
  universalIdentifier: ALL_CRISP_CONVERSATIONS_VIEW_UID,
  name: 'Crisp conversations',
  objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconMessage',
  position: 0,
  fields: COLUMNS.map((column, position) => ({
    ...column,
    position,
    isVisible: true,
  })),
});
