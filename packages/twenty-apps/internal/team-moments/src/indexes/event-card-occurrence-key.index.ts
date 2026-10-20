import { defineIndex } from 'twenty-sdk/define';

import {
  EVENT_CARD_OCCURRENCE_KEY_FIELD_UID,
  EVENT_CARD_OCCURRENCE_KEY_INDEX_UID,
  EVENT_CARD_OCCURRENCE_KEY_INDEX_FIELD_UID,
  EVENT_CARD_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: EVENT_CARD_OCCURRENCE_KEY_INDEX_UID,
  objectUniversalIdentifier: EVENT_CARD_OBJECT_UID,
  fields: [
    {
      universalIdentifier: EVENT_CARD_OCCURRENCE_KEY_INDEX_FIELD_UID,
      fieldUniversalIdentifier: EVENT_CARD_OCCURRENCE_KEY_FIELD_UID,
    },
  ],
});
