import { defineIndex } from 'twenty-sdk/define';

import {
  SPECIAL_DAY_IS_ACTIVE_FIELD_UID,
  SPECIAL_DAY_KIND_FIELD_UID,
  SPECIAL_DAY_KIND_IS_ACTIVE_INDEX_UID,
  SPECIAL_DAY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SPECIAL_DAY_KIND_IS_ACTIVE_INDEX_UID,
  objectUniversalIdentifier: SPECIAL_DAY_OBJECT_UID,
  fields: [
    { fieldUniversalIdentifier: SPECIAL_DAY_KIND_FIELD_UID },
    { fieldUniversalIdentifier: SPECIAL_DAY_IS_ACTIVE_FIELD_UID },
  ],
});
