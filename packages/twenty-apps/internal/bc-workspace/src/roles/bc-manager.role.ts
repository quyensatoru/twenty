import { defineRole } from 'twenty-sdk/define';

import {
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
  BC_WORKSPACE_MANAGER_ROLE_UID,
  VIP_CLIENT_OBJECT_UID,
} from '../constants/universal-identifiers';

// Member access plus read on every BC Workspace record, financial ones
// included. Team boundaries stay with the app routes: Twenty's row-level
// predicates cannot express "PIC belongs to a team I manage".
export default defineRole({
  universalIdentifier: BC_WORKSPACE_MANAGER_ROLE_UID,
  label: 'BC Workspace — Manager',
  description:
    'Member access plus every BC Workspace record, payments and MRR included.',
  icon: 'IconUsers',
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  canUpdateAllSettings: false,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  objectPermissions: [
    VIP_CLIENT_OBJECT_UID,
    BC_TASK_OBJECT_UID,
    BC_ISSUE_OBJECT_UID,
    BC_ACTIVITY_OBJECT_UID,
    BC_REVIEW_OBJECT_UID,
    BC_OPPORTUNITY_OBJECT_UID,
    BC_SUBSCRIPTION_EVENT_OBJECT_UID,
    BC_PAYMENT_OBJECT_UID,
    BC_PLAN_OBJECT_UID,
    BC_TEAM_OBJECT_UID,
    BC_MEMBER_OBJECT_UID,
  ].map((objectUniversalIdentifier) => ({
    objectUniversalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: false,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  })),
});
