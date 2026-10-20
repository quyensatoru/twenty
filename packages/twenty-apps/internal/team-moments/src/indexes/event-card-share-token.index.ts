import { defineIndex } from 'twenty-sdk/define';

import {
  EVENT_CARD_SHARE_TOKEN_FIELD_UID,
  EVENT_CARD_SHARE_TOKEN_INDEX_UID,
  EVENT_CARD_SHARE_TOKEN_INDEX_FIELD_UID,
  EVENT_CARD_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: EVENT_CARD_SHARE_TOKEN_INDEX_UID,
  objectUniversalIdentifier: EVENT_CARD_OBJECT_UID,
  fields: [
    {
      universalIdentifier: EVENT_CARD_SHARE_TOKEN_INDEX_FIELD_UID,
      fieldUniversalIdentifier: EVENT_CARD_SHARE_TOKEN_FIELD_UID,
    },
  ],
});
