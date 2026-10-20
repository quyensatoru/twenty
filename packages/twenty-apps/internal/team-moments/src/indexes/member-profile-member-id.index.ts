import { defineIndex } from 'twenty-sdk/define';

import {
  MEMBER_PROFILE_MEMBER_ID_FIELD_UID,
  MEMBER_PROFILE_MEMBER_ID_INDEX_UID,
  MEMBER_PROFILE_MEMBER_ID_INDEX_FIELD_UID,
  MEMBER_PROFILE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: MEMBER_PROFILE_MEMBER_ID_INDEX_UID,
  objectUniversalIdentifier: MEMBER_PROFILE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: MEMBER_PROFILE_MEMBER_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: MEMBER_PROFILE_MEMBER_ID_FIELD_UID,
    },
  ],
});
