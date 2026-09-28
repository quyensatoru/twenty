import { defineIndex } from 'twenty-sdk/define';

import {
  WORKLOG_MEMBER_FIELD_UID,
  WORKLOG_MEMBER_ID_INDEX_FIELD_UID,
  WORKLOG_MEMBER_ID_INDEX_UID,
  WORKLOG_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: WORKLOG_MEMBER_ID_INDEX_UID,
  objectUniversalIdentifier: WORKLOG_OBJECT_UID,
  fields: [
    {
      universalIdentifier: WORKLOG_MEMBER_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: WORKLOG_MEMBER_FIELD_UID,
    },
  ],
});
