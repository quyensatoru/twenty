export type BcScopeRole = 'ADMIN' | 'MANAGER' | 'BC' | 'NONE';

// What the caller may see. `visibleMemberIds` null means every PIC (admins);
// managers also see the unassigned clients of the teams they manage, so they
// can assign them.
export type BcScope = {
  workspaceMemberId: string | null;
  memberName: string | null;
  role: BcScopeRole;
  teamIds: string[];
  managedTeamIds: string[];
  visibleMemberIds: string[] | null;
  canSeeUnassigned: boolean;
  canSeeFinance: boolean;
  canManageSettings: boolean;
  canReassignPic: boolean;
};
