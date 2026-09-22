import {
  defineRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  BD_MANAGER_ROLE_UID,
  MERCHANT_OBJECT_UID,
  PROSPECT_OBJECT_UID,
  UPSELL_DEAL_OBJECT_UID,
} from '../constants/universal-identifiers';

const fullAccess = {
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

export default defineRole({
  universalIdentifier: BD_MANAGER_ROLE_UID,
  label: 'BD Manager',
  description:
    'Everything BD can do, plus owner assignment and CSV import of prospects.',
  icon: 'IconUserCog',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    { objectUniversalIdentifier: PROSPECT_OBJECT_UID, ...fullAccess },
    { objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID, ...fullAccess },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
      ...fullAccess,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      ...fullAccess,
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
});
