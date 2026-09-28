import { defineIndex } from 'twenty-sdk/define';

import {
  SHIFT_DATE_FIELD_UID,
  SHIFT_DATE_INDEX_UID,
  SHIFT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SHIFT_DATE_INDEX_UID,
  objectUniversalIdentifier: SHIFT_OBJECT_UID,
  fields: [{ fieldUniversalIdentifier: SHIFT_DATE_FIELD_UID }],
});
