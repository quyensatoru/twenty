import { defineIndex } from 'twenty-sdk/define';

import {
  BC_ACTIVITY_OBJECT_UID,
  BC_ACTIVITY_VIP_CLIENT_FIELD_UID,
  BC_ACTIVITY_CLIENT_OCCURRED_INDEX_FIELD_UID,
  BC_ACTIVITY_CLIENT_OCCURRED_INDEX_UID,
  BC_ACTIVITY_CLIENT_OCCURRED_INDEX_SECOND_FIELD_UID,
  BC_ACTIVITY_OCCURRED_AT_FIELD_UID,
} from '../constants/universal-identifiers';

// Timelines read a client's activity newest first.
export default defineIndex({
  universalIdentifier: BC_ACTIVITY_CLIENT_OCCURRED_INDEX_UID,
  objectUniversalIdentifier: BC_ACTIVITY_OBJECT_UID,
  fields: [
    {
      universalIdentifier: BC_ACTIVITY_CLIENT_OCCURRED_INDEX_FIELD_UID,
      fieldUniversalIdentifier: BC_ACTIVITY_VIP_CLIENT_FIELD_UID,
    },
    {
      universalIdentifier: BC_ACTIVITY_CLIENT_OCCURRED_INDEX_SECOND_FIELD_UID,
      fieldUniversalIdentifier: BC_ACTIVITY_OCCURRED_AT_FIELD_UID,
    },
  ],
});
