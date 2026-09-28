import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  APP_RUNTIME_ROLE_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_SEND_OBJECT_UID,
  EMAIL_TEMPLATE_OBJECT_UID,
  MERCHANT_EVENT_OBJECT_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

const readWrite = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const readWriteDelete = {
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

// What the jobs, routes and the Email Studio page run as. The studio creates,
// edits and deletes templates and campaigns, hence soft delete on those two.
// Merchant is writable only for the unsubscribe flag; reading every merchant
// also needs app-scope bypass, which machine contexts get automatically
// (should-bypass-app-scope.util.ts).
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Merchant Email Campaigns runtime',
  description: 'Role the email campaign jobs run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
      ...readWriteDelete,
    },
    { objectUniversalIdentifier: EMAIL_SEND_OBJECT_UID, ...readWrite },
    {
      objectUniversalIdentifier: EMAIL_TEMPLATE_OBJECT_UID,
      ...readWriteDelete,
    },
    { objectUniversalIdentifier: MERCHANT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: MERCHANT_EVENT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
  ],
});
