import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  PROSPECT_OBJECT_UID,
  UPSELL_DEAL_OBJECT_UID,
} from '../constants/universal-identifiers';

export const APP_RUNTIME_ROLE_UID = '5de4ec17-4cf3-49b5-a18c-75b75b263883';

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

// Role the app's own jobs run as. Narrow on purpose: the sync reads merchants
// and writes prospects and deals, nothing else. Reading merchants also needs
// app-scope bypass, which machine contexts get automatically
// (should-bypass-app-scope.util.ts).
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'BD Prospects runtime',
  description: 'Role the BD Prospects jobs run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    { objectUniversalIdentifier: PROSPECT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: MERCHANT_OBJECT_UID, ...readWrite },
    // Read-only: the sync resolves app ids to the keys written into
    // prospect.appsUsed, it never edits the app registry.
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
  ],
});
