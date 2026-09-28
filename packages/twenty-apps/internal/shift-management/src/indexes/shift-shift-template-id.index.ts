import { defineIndex } from 'twenty-sdk/define';

import {
  SHIFT_OBJECT_UID,
  SHIFT_TEMPLATE_ID_INDEX_UID,
  SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID,
  SHIFT_TEMPLATE_ID_INDEX_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SHIFT_TEMPLATE_ID_INDEX_UID,
  objectUniversalIdentifier: SHIFT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: SHIFT_TEMPLATE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID,
    },
  ],
});
