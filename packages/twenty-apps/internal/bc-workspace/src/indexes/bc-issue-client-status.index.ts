import { defineIndex } from 'twenty-sdk/define';

import {
  BC_ISSUE_OBJECT_UID,
  BC_ISSUE_VIP_CLIENT_FIELD_UID,
  BC_ISSUE_CLIENT_STATUS_INDEX_FIELD_UID,
  BC_ISSUE_CLIENT_STATUS_INDEX_UID,
  BC_ISSUE_CLIENT_STATUS_INDEX_SECOND_FIELD_UID,
  BC_ISSUE_STATUS_FIELD_UID,
} from '../constants/universal-identifiers';

// Status recompute counts a client's open issues.
export default defineIndex({
  universalIdentifier: BC_ISSUE_CLIENT_STATUS_INDEX_UID,
  objectUniversalIdentifier: BC_ISSUE_OBJECT_UID,
  fields: [
    {
      universalIdentifier: BC_ISSUE_CLIENT_STATUS_INDEX_FIELD_UID,
      fieldUniversalIdentifier: BC_ISSUE_VIP_CLIENT_FIELD_UID,
    },
    {
      universalIdentifier: BC_ISSUE_CLIENT_STATUS_INDEX_SECOND_FIELD_UID,
      fieldUniversalIdentifier: BC_ISSUE_STATUS_FIELD_UID,
    },
  ],
});
