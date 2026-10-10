import {
  defineApplicationRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  SystemPermissionFlag,
} from 'twenty-sdk/define';

import {
  APP_ACCESS_OBJECT_UID,
  APP_OBJECT_UID,
  APP_RUNTIME_ROLE_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
  DEVELOPMENT_DELIVERY_OBJECT_UID,
  EPIC_OBJECT_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_HISTORY_OBJECT_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  PROJECT_OBJECT_UID,
  REPOSITORY_OBJECT_UID,
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
  // WORKSPACE_MEMBERS is what lets sync-app-scope-mirror and the appAccess
  // trigger write `scopedAppIds`, the mirror every row-level app-scope
  // predicate reads off the caller's own member row. There is no narrower way
  // in: workspaceMember is special-cased in
  // workspace-roles-permissions-cache.service.ts, where an objectPermission
  // row is ignored and this flag alone decides the write.
  //
  // DANGEROUS ON ITS OWN. It is the APPLICATION that carries it, so any route
  // could edit any member — name, avatar, anything — and the server would
  // never see the person behind the call. Only the two mirror writers may use
  // it, and only for `scopedAppIds`.
  //
  // VIEWS is what lets the project.created trigger build a project its own
  // Kanban: creating a workspace-visible view is gated on this flag, for an
  // application exactly as for a person (ViewAccessService.canUserCreateView).
  // Without it the trigger fails with "You do not have permission to create
  // workspace-level views" and a new project silently has no board.
  permissionFlagUniversalIdentifiers: [
    SystemPermissionFlag.VIEWS,
    SystemPermissionFlag.WORKSPACE_MEMBERS,
  ],
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
    { objectUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID, ...readWriteDelete },
    { objectUniversalIdentifier: REPOSITORY_OBJECT_UID, ...readWriteDelete },
    {
      objectUniversalIdentifier: DEVELOPMENT_DELIVERY_OBJECT_UID,
      ...readWriteDelete,
    },
    {
      objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
      ...readWriteDelete,
    },
    {
      // Update, not readOnly: update-merchant-custom-settings writes
      // `customSettings` on an object customer-support owns. Deletion stays
      // off — a merchant's life cycle is not this app's business.
      objectUniversalIdentifier: MERCHANT_OBJECT_UID,
      ...readOnly,
      canUpdateObjectRecords: true,
    },
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: APP_ACCESS_OBJECT_UID, ...readOnly },
    {
      // Read-only on purpose, and it would be read-only anyway: the engine
      // ignores an objectPermission row for workspaceMember entirely and
      // decides writes from the WORKSPACE_MEMBERS flag above
      // (workspace-roles-permissions-cache.service.ts).
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      ...readOnly,
    },
  ],
});
