import { type ApiClient } from '../../types/api-client';
import { type WorkspaceMemberSummary } from '../../types/bc-records';
import { listAllRecords } from './list-all-records.util';

type WorkspaceMemberNode = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  avatarUrl?: string | null;
  userEmail?: string | null;
};

export const listWorkspaceMembers = async (
  client: ApiClient,
): Promise<WorkspaceMemberSummary[]> => {
  const nodes = await listAllRecords<WorkspaceMemberNode>({
    client,
    pluralName: 'workspaceMembers',
    selection: {
      id: true,
      name: { firstName: true, lastName: true },
      avatarUrl: true,
      userEmail: true,
    },
  });

  return nodes.map((node) => ({
    id: node.id,
    name:
      [node.name?.firstName, node.name?.lastName]
        .filter((part) => typeof part === 'string' && part.length > 0)
        .join(' ') ||
      node.userEmail ||
      'Unknown member',
    avatarUrl: node.avatarUrl ?? null,
    email: node.userEmail ?? null,
  }));
};

export const indexMemberNames = (
  members: WorkspaceMemberSummary[],
): Map<string, string> =>
  new Map(members.map((member) => [member.id, member.name]));
