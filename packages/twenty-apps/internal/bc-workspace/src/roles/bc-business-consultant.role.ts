import { defineRole, RowLevelPermissionPredicateOperand } from 'twenty-sdk/define';

import {
  BC_ACTIVITY_OBJECT_UID,
  BC_ISSUE_OBJECT_UID,
  BC_MEMBER_OBJECT_UID,
  BC_OPPORTUNITY_OBJECT_UID,
  BC_PAYMENT_OBJECT_UID,
  BC_PLAN_MONTHLY_PRICE_FIELD_UID,
  BC_PLAN_OBJECT_UID,
  BC_REVIEW_OBJECT_UID,
  BC_SUBSCRIPTION_EVENT_ATTRIBUTION_EVIDENCE_FIELD_UID,
  BC_SUBSCRIPTION_EVENT_MRR_DELTA_FIELD_UID,
  BC_SUBSCRIPTION_EVENT_OBJECT_UID,
  BC_TASK_OBJECT_UID,
  BC_TASK_OWNER_FIELD_UID,
  BC_TEAM_OBJECT_UID,
  BC_WORKSPACE_BC_ROLE_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PIC_FIELD_UID,
} from '../constants/universal-identifiers';

export const BC_ROLE_VIP_CLIENT_PIC_PREDICATE_UID = '8c1e1a1e-0cc3-487f-8350-eeb1f3514c63';
export const BC_ROLE_TASK_OWNER_PREDICATE_UID = '9ca76b3c-626f-40ee-930f-6d94a0fc88db';

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const noAccess = {
  canReadObjectRecords: false,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

// Shaped like the standard Member role because a workspace member holds one
// role only: what it does not grant, the person loses. The delta enforces the
// BC Workspace rules outside the app's own routes, so Twenty's record pages
// and API cannot show a BC another BC's clients or any money figure.
export default defineRole({
  universalIdentifier: BC_WORKSPACE_BC_ROLE_UID,
  label: 'BC Workspace — Business Consultant',
  description:
    'Member access plus BC Workspace: own VIP clients and tasks only, no payments, prices or MRR.',
  icon: 'IconUserStar',
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  canUpdateAllSettings: false,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  objectPermissions: [
    { objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID, ...readOnly },
    {
      objectUniversalIdentifier: BC_TASK_OBJECT_UID,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    ...[
      BC_ISSUE_OBJECT_UID,
      BC_ACTIVITY_OBJECT_UID,
      BC_REVIEW_OBJECT_UID,
      BC_OPPORTUNITY_OBJECT_UID,
      BC_SUBSCRIPTION_EVENT_OBJECT_UID,
      BC_PLAN_OBJECT_UID,
      BC_TEAM_OBJECT_UID,
      BC_MEMBER_OBJECT_UID,
    ].map((objectUniversalIdentifier) => ({ objectUniversalIdentifier, ...readOnly })),
    { objectUniversalIdentifier: BC_PAYMENT_OBJECT_UID, ...noAccess },
  ],
  fieldPermissions: [
    {
      objectUniversalIdentifier: BC_PLAN_OBJECT_UID,
      fieldUniversalIdentifier: BC_PLAN_MONTHLY_PRICE_FIELD_UID,
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: BC_SUBSCRIPTION_EVENT_OBJECT_UID,
      fieldUniversalIdentifier: BC_SUBSCRIPTION_EVENT_MRR_DELTA_FIELD_UID,
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: BC_SUBSCRIPTION_EVENT_OBJECT_UID,
      fieldUniversalIdentifier: BC_SUBSCRIPTION_EVENT_ATTRIBUTION_EVIDENCE_FIELD_UID,
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
  ],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: BC_ROLE_VIP_CLIENT_PIC_PREDICATE_UID,
      objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
      fieldUniversalIdentifier: VIP_CLIENT_PIC_FIELD_UID,
      operand: RowLevelPermissionPredicateOperand.IS,
      value: { isCurrentWorkspaceMemberSelected: true, selectedRecordIds: [] },
    },
    {
      universalIdentifier: BC_ROLE_TASK_OWNER_PREDICATE_UID,
      objectUniversalIdentifier: BC_TASK_OBJECT_UID,
      fieldUniversalIdentifier: BC_TASK_OWNER_FIELD_UID,
      operand: RowLevelPermissionPredicateOperand.IS,
      value: { isCurrentWorkspaceMemberSelected: true, selectedRecordIds: [] },
    },
  ],
});
