import { type ApiClient } from '../../types/api-client';
import { type DiscussionMember } from './discussion-storage.util';
import { listScopedRecords } from './list-scoped-records.util';

// Name and email for a handful of workspace members, with no app-access
// gate: the caller already knows these ids are allowed to be here (an
// assignee came from the assignee picker, an actor is the caller itself).
export const fetchMembersById = async (
  client: ApiClient,
  memberIds: readonly string[],
): Promise<Map<string, DiscussionMember>> => {
  const ids = [...new Set(memberIds)];
  if (ids.length === 0) return new Map();

  const members = await listScopedRecords<DiscussionMember>({
    client,
    pluralName: 'workspaceMembers',
    filter: { id: { in: ids } },
    selection: {
      id: true,
      name: { firstName: true, lastName: true },
      avatarUrl: true,
      userEmail: true,
    },
  });

  return new Map(members.map((member) => [member.id, member]));
};
