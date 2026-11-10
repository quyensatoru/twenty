import { MetadataApiClient } from 'twenty-client-sdk/metadata';

type ObjectPermissionNode = {
  objectMetadataId?: string | null;
  canUpdateObjectRecords?: boolean | null;
};

export type MemberAccess = {
  workspaceMemberId: string | null;
  name: string | null;
  canUpdate: boolean;
  isAdmin: boolean;
};

// Twenty's built-in Admin role. Settings permission alone is not enough:
// roles such as "Full Read Only Access" also carry it. Read from the member's
// own roles: getRoles needs the ROLES flag, which the delegated token
// (member intersected with the app role) never has.
const ADMIN_ROLE_UNIVERSAL_IDENTIFIER = '20202020-02c2-43f2-b94d-cab1f2b532eb';

// Routes write with the app's role, so the calling member's own role is read
// here to decide what they may change through them.
export const resolveMemberAccess = async (
  objectUniversalIdentifier: string,
): Promise<MemberAccess> => {
  const result = (await new MetadataApiClient().query({
    currentUser: {
      workspaceMember: {
        id: true,
        name: { firstName: true, lastName: true },
        roles: { universalIdentifier: true },
      },
      currentUserWorkspace: {
        objectPermissions: {
          objectMetadataId: true,
          canUpdateObjectRecords: true,
        },
      },
    },
    objects: {
      __args: {
        paging: { first: 1 },
        filter: { universalIdentifier: { eq: objectUniversalIdentifier } },
      },
      edges: { node: { id: true } },
    },
  })) as {
    currentUser?: {
      workspaceMember?: {
        id?: string;
        name?: { firstName?: string; lastName?: string } | null;
        roles?: { universalIdentifier?: string | null }[] | null;
      } | null;
      currentUserWorkspace?: {
        objectPermissions?: ObjectPermissionNode[] | null;
      } | null;
    } | null;
    objects?: { edges?: { node?: { id?: string } }[] };
  };

  const objectId = result.objects?.edges?.[0]?.node?.id ?? null;
  const member = result.currentUser?.workspaceMember ?? null;
  const name = [member?.name?.firstName, member?.name?.lastName]
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(' ');

  return {
    workspaceMemberId: member?.id ?? null,
    name: name.length > 0 ? name : null,
    canUpdate:
      objectId !== null &&
      (result.currentUser?.currentUserWorkspace?.objectPermissions ?? []).some(
        (permission) =>
          permission.objectMetadataId === objectId &&
          permission.canUpdateObjectRecords === true,
      ),
    isAdmin: (member?.roles ?? []).some(
      (role) => role.universalIdentifier === ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ),
  };
};
