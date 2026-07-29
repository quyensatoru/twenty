export type RandomUserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  canImpersonate: boolean;
  canAccessFullAdminPanel: boolean;
  isEmailVerified: boolean;
};

export type RandomUserWorkspaceData = {
  id: string;
  userId: string;
  workspaceId: string;
};

export type RandomWorkspaceMemberData = {
  id: string;
  nameFirstName: string;
  nameLastName: string;
  locale: string;
  colorScheme: string;
  userEmail: string;
  userId: string;
};

// ponytail: dev seeder only needs the named Apple/YC members, no filler accounts
export function generateRandomUsers(): {
  users: RandomUserData[];
  userWorkspaces: RandomUserWorkspaceData[];
  workspaceMembers: RandomWorkspaceMemberData[];
  userIds: Record<string, string>;
  userWorkspaceIds: Record<string, string>;
  workspaceMemberIds: Record<string, string>;
} {
  return {
    users: [],
    userWorkspaces: [],
    workspaceMembers: [],
    userIds: {},
    userWorkspaceIds: {},
    workspaceMemberIds: {},
  };
}
