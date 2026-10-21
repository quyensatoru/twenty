import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_ACCESS_OBJECT_UID,
  APP_OBJECT_UID,
  APP_RUNTIME_ROLE_UID,
  HEALTH_INCIDENT_OBJECT_UID,
  HEALTH_MONITOR_OBJECT_UID,
  HEALTH_SNAPSHOT_OBJECT_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

const readWrite = {
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

// Crons and routes act with the application token. Who may see or change a
// monitor is decided per route from the caller's App access grants, the same
// rule Task Manager applies to the app itself.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Health Monitor runtime',
  description: 'Role the health crons and dashboard routes run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    { objectUniversalIdentifier: HEALTH_MONITOR_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: HEALTH_SNAPSHOT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: HEALTH_INCIDENT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: APP_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: APP_ACCESS_OBJECT_UID, ...readOnly },
    { objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID, ...readOnly },
  ],
});
