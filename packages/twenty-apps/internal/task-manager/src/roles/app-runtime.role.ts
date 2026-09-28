import {
  defineApplicationRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  APP_ACCESS_OBJECT_UID,
  APP_OBJECT_UID,
  APP_RUNTIME_ROLE_UID,
  EPIC_OBJECT_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  PROJECT_OBJECT_UID,
  SPRINT_OBJECT_UID,
  WORKLOG_OBJECT_UID,
} from '../constants/universal-identifiers';

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

// What every route in src/logic-functions/ runs as. It deliberately holds
// FULL access to the app's own objects and NO global flag: app-scope is not a
// role concept here, it is enforced per route against the caller's appAccess
// grants (src/logic-functions/app-scope/). A route that read records through a
// narrower role would be unable to resolve the project -> app chain it needs
// to decide whether the caller may see them at all.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Task Manager runtime',
  description: 'Role the task manager routes run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    { objectUniversalIdentifier: PROJECT_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: ISSUE_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID, ...readWriteDelete },
    {
      objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
      ...readWriteDelete,
    },
    { objectUniversalIdentifier: EPIC_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: SPRINT_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: WORKLOG_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: MERCHANT_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: APP_ACCESS_OBJECT_UID, ...readOnly },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      ...readOnly,
    },
  ],
});
