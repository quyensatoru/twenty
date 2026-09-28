import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_RUNTIME_ROLE_UID,
  SHIFT_OBJECT_UID,
  SHIFT_TEMPLATE_OBJECT_UID,
  SPECIAL_DAY_OBJECT_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

const fullAccess = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: true,
  canDestroyObjectRecords: true,
};

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

// What every route runs as. The routes are the ONLY access path to shift data
// once the workspace Member role loses read/write on these three objects
// (DEPLOY.md step "Khoá quyền truy cập trực tiếp"), so the role has to reach
// every row and each route re-applies the per-member scoping the fork's
// findMany/findOne query hooks used to apply.
//
// workspaceMember is read-only and only ever read for a display name — the
// roster and handover routes resolve "FirstName LastName" from it, exactly the
// two fields the fork's loadMemberNames read.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Shift Management runtime',
  description: 'Role the shift routes run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    { objectUniversalIdentifier: SHIFT_OBJECT_UID, ...fullAccess },
    { objectUniversalIdentifier: SHIFT_TEMPLATE_OBJECT_UID, ...fullAccess },
    { objectUniversalIdentifier: SPECIAL_DAY_OBJECT_UID, ...fullAccess },
    { objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID, ...readOnly },
  ],
});
