import { defineIndex } from 'twenty-sdk/define';

import {
  SHIFT_TEMPLATE_CODE_FIELD_UID,
  SHIFT_TEMPLATE_CODE_INDEX_FIELD_UID,
  SHIFT_TEMPLATE_CODE_INDEX_UID,
  SHIFT_TEMPLATE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SHIFT_TEMPLATE_CODE_INDEX_UID,
  objectUniversalIdentifier: SHIFT_TEMPLATE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: SHIFT_TEMPLATE_CODE_INDEX_FIELD_UID,
      fieldUniversalIdentifier: SHIFT_TEMPLATE_CODE_FIELD_UID,
    },
  ],
});
