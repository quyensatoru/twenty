import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  APP_RUNTIME_ROLE_UID,
  BC_ACTIVITY_OBJECT_UID,
  BC_ISSUE_OBJECT_UID,
  BC_MEMBER_OBJECT_UID,
  BC_OPPORTUNITY_OBJECT_UID,
  BC_PAYMENT_OBJECT_UID,
  BC_PLAN_OBJECT_UID,
  BC_REVIEW_OBJECT_UID,
  BC_SUBSCRIPTION_EVENT_OBJECT_UID,
  BC_TASK_OBJECT_UID,
  BC_TEAM_OBJECT_UID,
  CRISP_CONVERSATION_OBJECT_UID,
  CRISP_MESSAGE_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  PROJECT_OBJECT_UID,
  VIP_CLIENT_OBJECT_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

const readWrite = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: true,
  canDestroyObjectRecords: false,
};

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

// Routes, triggers and crons act with the application token. Who may see a
// client, a task or a financial figure is decided per route from the
// caller's BC team membership, never by this role.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'BC Workspace runtime',
  description: 'Role the BC Workspace routes, triggers and crons run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    ...[
      VIP_CLIENT_OBJECT_UID,
      BC_TEAM_OBJECT_UID,
      BC_MEMBER_OBJECT_UID,
      BC_ISSUE_OBJECT_UID,
      BC_TASK_OBJECT_UID,
      BC_ACTIVITY_OBJECT_UID,
      BC_REVIEW_OBJECT_UID,
      BC_SUBSCRIPTION_EVENT_OBJECT_UID,
      BC_OPPORTUNITY_OBJECT_UID,
      BC_PAYMENT_OBJECT_UID,
      BC_PLAN_OBJECT_UID,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...readWrite,
    })),
    // Linking a merchant row to its VIP client writes merchant.vipClientId.
    { objectUniversalIdentifier: MERCHANT_OBJECT_UID, ...readWrite, canSoftDeleteObjectRecords: false },
    { objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: CRISP_MESSAGE_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: PROJECT_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: ISSUE_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID, ...readOnly },
  ],
});
