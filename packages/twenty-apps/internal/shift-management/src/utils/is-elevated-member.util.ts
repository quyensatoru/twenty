// The fork's isElevatedActor read the role flag canUpdateAllObjectRecords
// through shouldBypassAppScope. An app cannot see role flags, so elevation is
// declared instead: the SHIFT_LEADER_EMAILS variable, plus anyone holding the
// WORKSPACE_MEMBERS permission flag (a workspace admin), who could grant
// themselves the access anyway.
const ADMIN_PERMISSION_FLAG = 'WORKSPACE_MEMBERS';

export const isElevatedMember = ({
  email,
  permissionFlags,
  leaderEmails,
}: {
  email: string | null | undefined;
  permissionFlags: string[];
  leaderEmails: string | undefined;
}): boolean => {
  if (permissionFlags.includes(ADMIN_PERMISSION_FLAG)) {
    return true;
  }

  const allowList = (leaderEmails ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  if (allowList.includes('*')) {
    return true;
  }

  const normalizedEmail = email?.trim().toLowerCase() ?? '';

  return normalizedEmail.length > 0 && allowList.includes(normalizedEmail);
};
