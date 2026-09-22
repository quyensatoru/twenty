import {
  defineRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  BD_ROLE_UID,
  MERCHANT_OBJECT_UID,
  OWNER_ON_PROSPECT_FIELD_UID,
  OWNER_ON_UPSELL_DEAL_FIELD_UID,
  PROSPECT_OBJECT_UID,
  UPSELL_DEAL_OBJECT_UID,
} from '../constants/universal-identifiers';

const readWrite = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

// Narrow role on purpose: `canReadAllObjectRecords: false` keeps BD out of the
// rest of the CRM, and merchant rows stay subject to the workspace's app-scope
// grants on top of the read permission below (no appAccess grant means the
// Merchants column on a prospect simply comes back empty).
export default defineRole({
  universalIdentifier: BD_ROLE_UID,
  label: 'BD',
  description:
    'Works the High-Value Prospects list and the upsell pipeline. Cannot reassign owners or import.',
  icon: 'IconUserSearch',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    { objectUniversalIdentifier: PROSPECT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID, ...readWrite },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      ...readWrite,
    },
    // Needed for the target-app picker on a deal.
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
    {
      objectUniversalIdentifier: MERCHANT_OBJECT_UID,
      ...readOnly,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      ...readOnly,
    },
  ],
  // Owner assignment is a manager decision, enforced on the field itself
  // rather than by hiding a button.
  fieldPermissions: [
    {
      objectUniversalIdentifier: PROSPECT_OBJECT_UID,
      fieldUniversalIdentifier: OWNER_ON_PROSPECT_FIELD_UID,
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
      fieldUniversalIdentifier: OWNER_ON_UPSELL_DEAL_FIELD_UID,
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
  ],
});
