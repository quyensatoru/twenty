import { defineIndex } from 'twenty-sdk/define';

import {
  OCCASION_PLAN_OBJECT_UID,
  OCCASION_PLAN_OCCURRENCE_KEY_FIELD_UID,
  OCCASION_PLAN_OCCURRENCE_KEY_INDEX_FIELD_UID,
  OCCASION_PLAN_OCCURRENCE_KEY_INDEX_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: OCCASION_PLAN_OCCURRENCE_KEY_INDEX_UID,
  objectUniversalIdentifier: OCCASION_PLAN_OBJECT_UID,
  fields: [
    {
      universalIdentifier: OCCASION_PLAN_OCCURRENCE_KEY_INDEX_FIELD_UID,
      fieldUniversalIdentifier: OCCASION_PLAN_OCCURRENCE_KEY_FIELD_UID,
    },
  ],
});
