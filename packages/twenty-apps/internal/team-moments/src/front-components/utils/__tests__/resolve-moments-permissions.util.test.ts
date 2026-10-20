import { describe, expect, it } from 'vitest';

import { MEMBER_PROFILE_OBJECT_UID, TEAM_EVENT_OBJECT_UID } from '../../../constants/universal-identifiers';
import { buildMomentsPermissions } from '../resolve-moments-permissions.util';

const objects = [
  { id: 'team-event-id', universalIdentifier: TEAM_EVENT_OBJECT_UID },
  { id: 'member-profile-id', universalIdentifier: MEMBER_PROFILE_OBJECT_UID },
];

describe('buildMomentsPermissions', () => {
  it('allows both actions when the role can update both objects', () => {
    expect(
      buildMomentsPermissions({
        objects,
        objectPermissions: [
          { objectMetadataId: 'team-event-id', canUpdateObjectRecords: true },
          { objectMetadataId: 'member-profile-id', canUpdateObjectRecords: true },
        ],
      }),
    ).toEqual({ canManageEvents: true, canEditMemberProfiles: true });
  });

  it('denies both actions for a read-only role', () => {
    expect(
      buildMomentsPermissions({
        objects,
        objectPermissions: [
          { objectMetadataId: 'team-event-id', canUpdateObjectRecords: false },
          { objectMetadataId: 'member-profile-id', canUpdateObjectRecords: false },
        ],
      }),
    ).toEqual({ canManageEvents: false, canEditMemberProfiles: false });
  });

  it('denies an action when the object or its permission is missing', () => {
    expect(
      buildMomentsPermissions({
        objects: [{ id: 'team-event-id', universalIdentifier: TEAM_EVENT_OBJECT_UID }],
        objectPermissions: [{ objectMetadataId: 'team-event-id', canUpdateObjectRecords: true }],
      }),
    ).toEqual({ canManageEvents: true, canEditMemberProfiles: false });
  });
});
