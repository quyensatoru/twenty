import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { DISCOUNT_OBJECT_UID } from '../../constants/universal-identifiers';

type ObjectPermissionNode = {
  objectMetadataId?: string | null;
  canUpdateObjectRecords?: boolean | null;
};

export type DiscountCaller = {
  workspaceMemberId: string | null;
  name: string | null;
  canEdit: boolean;
  canConfigure: boolean;
};

// Twenty's built-in Admin role. Settings permission alone is not enough:
// roles such as "Full Read Only Access" also carry it. Read from the member's
// own roles: getRoles needs the ROLES flag, which the delegated token
// (member intersected with the app role) never has.
const ADMIN_ROLE_UNIVERSAL_IDENTIFIER = '20202020-02c2-43f2-b94d-cab1f2b532eb';

// The routes write with the app's role, so the member's own role is checked
// here: whoever may edit discounts in Settings > Roles (Admin and CSE) may
// use the page to create, change and delete them; everyone else only reads.
export const resolveDiscountCaller = async (): Promise<DiscountCaller> => {
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
        filter: { universalIdentifier: { eq: DISCOUNT_OBJECT_UID } },
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

  const discountObjectId = result.objects?.edges?.[0]?.node?.id ?? null;
  const member = result.currentUser?.workspaceMember ?? null;
  const name = [member?.name?.firstName, member?.name?.lastName]
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(' ');

  return {
    workspaceMemberId: member?.id ?? null,
    name: name.length > 0 ? name : null,
    canEdit:
      discountObjectId !== null &&
      (result.currentUser?.currentUserWorkspace?.objectPermissions ?? []).some(
        (permission) =>
          permission.objectMetadataId === discountObjectId &&
          permission.canUpdateObjectRecords === true,
      ),
    canConfigure: (member?.roles ?? []).some(
      (role) => role.universalIdentifier === ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ),
  };
};

export const assertCanEditDiscounts = (caller: DiscountCaller): void => {
  if (!caller.canEdit) {
    throw new Error(
      'Your role cannot change discounts. Ask an admin to give it edit access to Discounts.',
    );
  }
};

export const assertCanConfigureDiscounts = (caller: DiscountCaller): void => {
  if (!caller.canConfigure) {
    throw new Error('Only members with the Admin role can change app connections.');
  }
};
