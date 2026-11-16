import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { type ApiClient } from '../../types/api-client';
import { type BcMemberRecord } from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import { listAllRecords } from './list-all-records.util';

// Twenty's built-in Admin role, plus anyone allowed to manage workspace
// settings or roles, sees every team.
const ADMIN_ROLE_UNIVERSAL_IDENTIFIER = '20202020-02c2-43f2-b94d-cab1f2b532eb';
const ADMIN_PERMISSION_FLAGS = ['WORKSPACE', 'ROLES'];

export const BC_MEMBER_SELECTION = {
  id: true,
  name: true,
  memberRole: true,
  crispOperatorNames: true,
  isActive: true,
  memberId: true,
  teamId: true,
};

type CurrentUserResult = {
  currentUser?: {
    workspaceMember?: {
      id?: string;
      name?: { firstName?: string; lastName?: string } | null;
      roles?: { universalIdentifier?: string | null }[] | null;
    } | null;
    currentUserWorkspace?: { permissionFlags?: string[] | null } | null;
  } | null;
};

export const buildBcScope = ({
  workspaceMemberId,
  memberName,
  isAdmin,
  memberships,
  teamMembers,
}: {
  workspaceMemberId: string | null;
  memberName: string | null;
  isAdmin: boolean;
  memberships: BcMemberRecord[];
  teamMembers: BcMemberRecord[];
}): BcScope => {
  const activeMemberships = memberships.filter(
    (membership) => membership.isActive,
  );
  const managedTeamIds = activeMemberships
    .filter((membership) => membership.memberRole === 'MANAGER')
    .flatMap((membership) =>
      membership.teamId === null ? [] : [membership.teamId],
    );
  const teamIds = [
    ...new Set(
      activeMemberships.flatMap((membership) =>
        membership.teamId === null ? [] : [membership.teamId],
      ),
    ),
  ];

  if (isAdmin) {
    return {
      workspaceMemberId,
      memberName,
      role: 'ADMIN',
      teamIds,
      managedTeamIds,
      visibleMemberIds: null,
      canSeeUnassigned: true,
      canSeeFinance: true,
      canManageSettings: true,
      canReassignPic: true,
    };
  }

  if (managedTeamIds.length > 0) {
    const visibleMemberIds = new Set<string>(
      workspaceMemberId === null ? [] : [workspaceMemberId],
    );

    for (const teamMember of teamMembers) {
      if (
        teamMember.teamId !== null &&
        managedTeamIds.includes(teamMember.teamId) &&
        teamMember.memberId !== null
      ) {
        visibleMemberIds.add(teamMember.memberId);
      }
    }

    return {
      workspaceMemberId,
      memberName,
      role: 'MANAGER',
      teamIds,
      managedTeamIds,
      visibleMemberIds: [...visibleMemberIds],
      canSeeUnassigned: true,
      canSeeFinance: true,
      canManageSettings: false,
      canReassignPic: true,
    };
  }

  if (activeMemberships.length > 0 && workspaceMemberId !== null) {
    return {
      workspaceMemberId,
      memberName,
      role: 'BC',
      teamIds,
      managedTeamIds: [],
      visibleMemberIds: [workspaceMemberId],
      canSeeUnassigned: false,
      canSeeFinance: false,
      canManageSettings: false,
      canReassignPic: false,
    };
  }

  return {
    workspaceMemberId,
    memberName,
    role: 'NONE',
    teamIds: [],
    managedTeamIds: [],
    visibleMemberIds: [],
    canSeeUnassigned: false,
    canSeeFinance: false,
    canManageSettings: false,
    canReassignPic: false,
  };
};

// Routes run with the application role, so the caller's own access is
// resolved here from their BC team memberships and checked on every query.
export const resolveBcScope = async (client: ApiClient): Promise<BcScope> => {
  const { currentUser } = (await new MetadataApiClient().query({
    currentUser: {
      workspaceMember: {
        id: true,
        name: { firstName: true, lastName: true },
        roles: { universalIdentifier: true },
      },
      currentUserWorkspace: { permissionFlags: true },
    },
  })) as CurrentUserResult;

  const member = currentUser?.workspaceMember ?? null;
  const workspaceMemberId = member?.id ?? null;
  const memberName =
    [member?.name?.firstName, member?.name?.lastName]
      .filter((part) => typeof part === 'string' && part.length > 0)
      .join(' ') || null;
  const isAdmin =
    workspaceMemberId === null ||
    (member?.roles ?? []).some(
      (role) => role.universalIdentifier === ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ) ||
    (currentUser?.currentUserWorkspace?.permissionFlags ?? []).some((flag) =>
      ADMIN_PERMISSION_FLAGS.includes(flag),
    );

  const memberships =
    workspaceMemberId === null
      ? []
      : await listAllRecords<BcMemberRecord>({
          client,
          pluralName: 'bcMembers',
          filter: { memberId: { eq: workspaceMemberId } },
          selection: BC_MEMBER_SELECTION,
        });
  const managedTeamIds = memberships
    .filter((membership) => membership.isActive && membership.memberRole === 'MANAGER')
    .flatMap((membership) =>
      membership.teamId === null ? [] : [membership.teamId],
    );
  const teamMembers =
    managedTeamIds.length === 0
      ? []
      : await listAllRecords<BcMemberRecord>({
          client,
          pluralName: 'bcMembers',
          filter: {
            teamId: { in: managedTeamIds },
            isActive: { eq: true },
          },
          selection: BC_MEMBER_SELECTION,
        });

  return buildBcScope({
    workspaceMemberId,
    memberName,
    isAdmin,
    memberships,
    teamMembers,
  });
};

// `teamId` undefined means the caller did not load it; an unassigned client
// then falls back to the coarse canSeeUnassigned rule.
export const canSeeClientOf = (
  scope: BcScope,
  picId: string | null,
  teamId?: string | null,
): boolean => {
  if (scope.visibleMemberIds === null) {
    return true;
  }

  if (picId !== null) {
    return scope.visibleMemberIds.includes(picId);
  }

  if (!scope.canSeeUnassigned) {
    return false;
  }

  return teamId === undefined
    ? true
    : teamId !== null && scope.managedTeamIds.includes(teamId);
};

export const assertCanSeeClient = (
  scope: BcScope,
  picId: string | null,
  teamId?: string | null,
): void => {
  if (!canSeeClientOf(scope, picId, teamId)) {
    throw new Error('Not authorized: you do not have access to this client.');
  }
};

export const assertCanSeeFinance = (scope: BcScope): void => {
  if (!scope.canSeeFinance) {
    throw new Error('Not authorized: financial data is only available to BC managers.');
  }
};

export const assertCanManageSettings = (scope: BcScope): void => {
  if (!scope.canManageSettings) {
    throw new Error('Not authorized: only workspace admins can change BC Workspace settings.');
  }
};

// GraphQL filter that limits a client query to what the caller may see.
export const buildVisibleClientFilter = (
  scope: BcScope,
): Record<string, unknown> | null => {
  if (scope.visibleMemberIds === null) {
    return null;
  }

  const filters: Record<string, unknown>[] = [];

  if (scope.visibleMemberIds.length > 0) {
    filters.push({ picId: { in: scope.visibleMemberIds } });
  }

  if (scope.canSeeUnassigned && scope.managedTeamIds.length > 0) {
    filters.push({
      and: [{ picId: { is: 'NULL' } }, { teamId: { in: scope.managedTeamIds } }],
    });
  }

  if (filters.length === 0) {
    // Matches nothing: no BC membership means no client.
    return { id: { is: 'NULL' } };
  }

  return filters.length === 1 ? filters[0] : { or: filters };
};
