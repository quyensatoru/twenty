import { type AppClient } from './create-app-client.util';

export type NotifiableMember = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  userEmail?: string | null;
};

export const formatMemberName = (
  member: NotifiableMember | undefined,
): string => {
  const fullName = `${member?.name?.firstName ?? ''} ${member?.name?.lastName ?? ''}`.trim();
  return fullName === '' ? 'Someone' : fullName;
};

// Every workspace member is implicitly visible to this app — there is no
// per-app scoping here, unlike task-manager — so this is a plain lookup, not
// a permission-filtered one.
export const listMembersById = async (
  client: AppClient,
  memberIds: readonly string[],
): Promise<Map<string, NotifiableMember>> => {
  const ids = [...new Set(memberIds)];
  if (ids.length === 0) return new Map();

  const result = (await client.query({
    workspaceMembers: {
      __args: { filter: { id: { in: ids } }, first: ids.length },
      edges: {
        node: {
          id: true,
          name: { firstName: true, lastName: true },
          userEmail: true,
        },
      },
    },
  })) as {
    workspaceMembers?: { edges?: { node: NotifiableMember }[] };
  };

  const members = (result.workspaceMembers?.edges ?? []).map(
    (edge) => edge.node,
  );

  return new Map(members.map((member) => [member.id, member]));
};
