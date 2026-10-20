import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { MEMBER_PROFILE_OBJECT_UID, TEAM_EVENT_OBJECT_UID } from '../../constants/universal-identifiers';

export type MomentsPermissions = {
  canManageEvents: boolean;
  canEditMemberProfiles: boolean;
};

export const NO_MOMENTS_PERMISSIONS: MomentsPermissions = {
  canManageEvents: false,
  canEditMemberProfiles: false,
};

type ObjectNode = { id?: string | null; universalIdentifier?: string | null };

type ObjectPermissionNode = { objectMetadataId?: string | null; canUpdateObjectRecords?: boolean | null };

export const buildMomentsPermissions = ({
  objects,
  objectPermissions,
}: {
  objects: ObjectNode[];
  objectPermissions: ObjectPermissionNode[];
}): MomentsPermissions => {
  const canUpdate = (objectUniversalIdentifier: string): boolean => {
    const objectId = objects.find((object) => object.universalIdentifier === objectUniversalIdentifier)?.id;

    return objectPermissions.some(
      (permission) => permission.objectMetadataId === objectId && permission.canUpdateObjectRecords === true,
    );
  };

  return {
    canManageEvents: canUpdate(TEAM_EVENT_OBJECT_UID),
    canEditMemberProfiles: canUpdate(MEMBER_PROFILE_OBJECT_UID),
  };
};

// Only hides controls: the server still enforces the member's role on every write.
export const resolveMomentsPermissions = async (): Promise<MomentsPermissions> => {
  const result = (await new MetadataApiClient().query({
    currentUser: {
      currentUserWorkspace: {
        objectPermissions: { objectMetadataId: true, canUpdateObjectRecords: true },
      },
    },
    objects: {
      __args: {
        paging: { first: 2 },
        filter: { universalIdentifier: { in: [TEAM_EVENT_OBJECT_UID, MEMBER_PROFILE_OBJECT_UID] } },
      },
      edges: { node: { id: true, universalIdentifier: true } },
    },
  })) as {
    currentUser?: { currentUserWorkspace?: { objectPermissions?: ObjectPermissionNode[] | null } | null } | null;
    objects?: { edges?: { node?: ObjectNode }[] };
  };

  return buildMomentsPermissions({
    objects: (result.objects?.edges ?? []).flatMap((edge) => (edge.node ? [edge.node] : [])),
    objectPermissions: result.currentUser?.currentUserWorkspace?.objectPermissions ?? [],
  });
};
