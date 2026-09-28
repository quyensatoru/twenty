import { defineIndex } from 'twenty-sdk/define';

import {
  SHIFT_TEMPLATE_IS_ACTIVE_FIELD_UID,
  SHIFT_TEMPLATE_IS_ACTIVE_INDEX_UID,
  SHIFT_TEMPLATE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SHIFT_TEMPLATE_IS_ACTIVE_INDEX_UID,
  objectUniversalIdentifier: SHIFT_TEMPLATE_OBJECT_UID,
  fields: [{ fieldUniversalIdentifier: SHIFT_TEMPLATE_IS_ACTIVE_FIELD_UID }],
});
