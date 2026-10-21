import { type ApiClient } from '../../types/api-client';
import { listAllRecords } from './list-all-records.util';

export type WorkspaceMemberSummary = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

type MemberNode = {
  id: string;
  userEmail?: string | null;
  avatarUrl?: string | null;
  name?: { firstName?: string | null; lastName?: string | null } | null;
};

export const listWorkspaceMembers = async (
  client: ApiClient,
): Promise<WorkspaceMemberSummary[]> =>
  (
    await listAllRecords<MemberNode>({
      client,
      pluralName: 'workspaceMembers',
      selection: {
        id: true,
        userEmail: true,
        avatarUrl: true,
        name: { firstName: true, lastName: true },
      },
    })
  ).map((member) => ({
    id: member.id,
    name:
      [member.name?.firstName, member.name?.lastName]
        .filter((part) => (part ?? '').trim().length > 0)
        .join(' ') ||
      member.userEmail ||
      'Member',
    email: member.userEmail ?? null,
    avatarUrl: member.avatarUrl ?? null,
  }));
