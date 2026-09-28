import { defineIndex } from 'twenty-sdk/define';

import {
  MEMBER_ON_SHIFT_FIELD_UID,
  SHIFT_MEMBER_ID_INDEX_FIELD_UID,
  SHIFT_MEMBER_ID_INDEX_UID,
  SHIFT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: SHIFT_MEMBER_ID_INDEX_UID,
  objectUniversalIdentifier: SHIFT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: SHIFT_MEMBER_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: MEMBER_ON_SHIFT_FIELD_UID,
    },
  ],
});
