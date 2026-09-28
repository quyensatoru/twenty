import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { SHIFT_LEADER_EMAILS_VARIABLE } from '../../constants/application-variable-names';
import { isElevatedMember } from '../../utils/is-elevated-member.util';

export type ShiftActor = {
  workspaceMemberId: string | null;
  email: string | null;
  isElevated: boolean;
};

type CurrentUserResult = {
  currentUser?: {
    email?: string | null;
    workspaceMember?: { id?: string | null } | null;
    currentUserWorkspace?: { permissionFlags?: string[] | null } | null;
  } | null;
};

// Runs inside an authenticated route, where the metadata client carries the
// CALLER's token, so `currentUser` is the member who clicked — never the
// application. Every route resolves the actor this way before touching data.
// The execution context already carries the member id; the query only adds the
// email and permission flags that decide elevation.
export const readActor = async (
  contextWorkspaceMemberId: string | null,
): Promise<ShiftActor> => {
  const { currentUser } = (await new MetadataApiClient().query({
    currentUser: {
      email: true,
      workspaceMember: { id: true },
      currentUserWorkspace: { permissionFlags: true },
    },
  })) as CurrentUserResult;

  const email = currentUser?.email ?? null;

  return {
    workspaceMemberId:
      contextWorkspaceMemberId ?? currentUser?.workspaceMember?.id ?? null,
    email,
    isElevated: isElevatedMember({
      email,
      permissionFlags: currentUser?.currentUserWorkspace?.permissionFlags ?? [],
      leaderEmails: process.env[SHIFT_LEADER_EMAILS_VARIABLE],
    }),
  };
};
