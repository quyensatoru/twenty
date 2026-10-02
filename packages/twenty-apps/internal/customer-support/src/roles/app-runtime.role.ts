import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_RUNTIME_ROLE_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

// The app has no routes yet, so nothing runs as this role today. It exists
// because a manifest must declare a default role, and it is scoped to the one
// object the app owns so that adding the first route cannot silently inherit
// access to anything else.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Customer Support runtime',
  description: 'Role the Customer Support routes run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: MERCHANT_OBJECT_UID,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: true,
      canDestroyObjectRecords: false,
    },
  ],
});
