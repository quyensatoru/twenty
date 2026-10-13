import { defineIndex } from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_LAST_MESSAGE_AT_FIELD_UID,
  CRISP_CONVERSATION_LAST_MESSAGE_AT_INDEX_FIELD_UID,
  CRISP_CONVERSATION_LAST_MESSAGE_AT_INDEX_UID,
  CRISP_CONVERSATION_OBJECT_UID,
} from '../constants/universal-identifiers';

// The inbox list is always ordered by the latest message.
export default defineIndex({
  universalIdentifier: CRISP_CONVERSATION_LAST_MESSAGE_AT_INDEX_UID,
  objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID,
  fields: [
    {
      universalIdentifier: CRISP_CONVERSATION_LAST_MESSAGE_AT_INDEX_FIELD_UID,
      fieldUniversalIdentifier: CRISP_CONVERSATION_LAST_MESSAGE_AT_FIELD_UID,
    },
  ],
});
