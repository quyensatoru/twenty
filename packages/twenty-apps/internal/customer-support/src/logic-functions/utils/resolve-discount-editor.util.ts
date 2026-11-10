import { DISCOUNT_OBJECT_UID } from '../../constants/universal-identifiers';
import { resolveMemberAccess } from './resolve-member-access.util';

export type DiscountCaller = {
  workspaceMemberId: string | null;
  name: string | null;
  canEdit: boolean;
  canConfigure: boolean;
};

// Whoever may edit discounts in Settings > Roles (Admin and CSE) may use the
// page to create, change and delete them; everyone else only reads.
export const resolveDiscountCaller = async (): Promise<DiscountCaller> => {
  const access = await resolveMemberAccess(DISCOUNT_OBJECT_UID);

  return {
    workspaceMemberId: access.workspaceMemberId,
    name: access.name,
    canEdit: access.canUpdate,
    canConfigure: access.isAdmin,
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
    throw new Error(
      'Only members with the Admin role can change app connections.',
    );
  }
};
