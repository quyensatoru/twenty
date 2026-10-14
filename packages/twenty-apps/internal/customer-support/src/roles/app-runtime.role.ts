import { defineApplicationRole, SystemPermissionFlag } from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  APP_RUNTIME_ROLE_UID,
  CRISP_CONVERSATION_ISSUE_OBJECT_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  CRISP_MESSAGE_OBJECT_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const readWrite = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: true,
  canDestroyObjectRecords: false,
};

// Scoped to what the Crisp sync and the support inbox touch: the chats it
// owns, the merchants and issues it links them to, and the app registry it
// reads to prefer a merchant of the same product. Issues are read-only: a chat
// links to an issue, it never edits one.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Customer Support runtime',
  description: 'Role the Customer Support routes run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  // The AI summary calls the workspace's own model through /rest/ai, which
  // is gated on this flag for an application as for a person.
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.AI],
  objectPermissions: [
    { objectUniversalIdentifier: MERCHANT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: CRISP_MESSAGE_OBJECT_UID, ...readWrite },
    {
      objectUniversalIdentifier: CRISP_CONVERSATION_ISSUE_OBJECT_UID,
      ...readWrite,
      // Unlinking removes the row outright; a soft-deleted link would still
      // hold the unique (conversation, issue) pair and block relinking.
      canDestroyObjectRecords: true,
    },
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: ISSUE_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID, ...readOnly },
    // Linking a chat to an issue puts the chat's merchant on the issue.
    { objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID, ...readWrite },
  ],
});
