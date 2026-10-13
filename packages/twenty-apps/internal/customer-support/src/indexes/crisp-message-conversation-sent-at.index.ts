import { defineIndex } from 'twenty-sdk/define';

import {
  CRISP_MESSAGE_CONVERSATION_FIELD_UID,
  CRISP_MESSAGE_OBJECT_UID,
  CRISP_MESSAGE_SENT_AT_FIELD_UID,
  CRISP_MESSAGE_SENT_AT_INDEX_CONVERSATION_FIELD_UID,
  CRISP_MESSAGE_SENT_AT_INDEX_SENT_AT_FIELD_UID,
  CRISP_MESSAGE_SENT_AT_INDEX_UID,
} from '../constants/universal-identifiers';

// A thread is read one conversation at a time, newest first.
export default defineIndex({
  universalIdentifier: CRISP_MESSAGE_SENT_AT_INDEX_UID,
  objectUniversalIdentifier: CRISP_MESSAGE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: CRISP_MESSAGE_SENT_AT_INDEX_CONVERSATION_FIELD_UID,
      fieldUniversalIdentifier: CRISP_MESSAGE_CONVERSATION_FIELD_UID,
    },
    {
      universalIdentifier: CRISP_MESSAGE_SENT_AT_INDEX_SENT_AT_FIELD_UID,
      fieldUniversalIdentifier: CRISP_MESSAGE_SENT_AT_FIELD_UID,
    },
  ],
});
