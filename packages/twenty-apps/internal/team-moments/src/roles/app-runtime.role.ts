import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_RUNTIME_ROLE_UID,
  EVENT_CARD_OBJECT_UID,
  EVENT_MESSAGE_OBJECT_UID,
  MEMBER_PROFILE_OBJECT_UID,
  OCCASION_PLAN_OBJECT_UID,
  POLL_OBJECT_UID,
  TEAM_EVENT_OBJECT_UID,
  WORKSPACE_MEMBER_OBJECT_UID,
} from '../constants/universal-identifiers';

const readWrite = {
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

// The front component's REST calls carry an application access token, so
// this role, not the member's, decides what the page can read and write. The
// public share routes run under it too and only read.
export default defineApplicationRole({
  universalIdentifier: APP_RUNTIME_ROLE_UID,
  label: 'Team Moments runtime',
  description: 'Role the Team Moments page and share routes run as',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  objectPermissions: [
    { objectUniversalIdentifier: EVENT_CARD_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: EVENT_MESSAGE_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: MEMBER_PROFILE_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: TEAM_EVENT_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: OCCASION_PLAN_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: POLL_OBJECT_UID, ...readWrite },
    { objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UID, ...readOnly },
  ],
});
