import { MEMBER_QUERY_LIMIT } from '../../constants/query-limits';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { formatMemberName } from '../../utils/format-member-name.util';

type WorkspaceMemberRow = {
  id: string;
  name: { firstName?: string | null; lastName?: string | null } | null;
};

// Resolve each distinct memberId to a display name. Only the composite `name`
// is read — no email, no avatar, nothing else about the member.
export const fetchMemberNames = async (
  client: ApiClient,
  memberIds: (string | null)[],
): Promise<Map<string, string | null>> => {
  const memberNameById = new Map<string, string | null>();

  const distinctMemberIds = [
    ...new Set(memberIds.filter((memberId): memberId is string => memberId !== null)),
  ];

  if (distinctMemberIds.length === 0) {
    return memberNameById;
  }

  const { workspaceMembers } = (await client.query({
    workspaceMembers: {
      __args: {
        filter: { id: { in: distinctMemberIds } },
        first: MEMBER_QUERY_LIMIT,
      },
      edges: { node: { id: true, name: { firstName: true, lastName: true } } },
    },
  })) as { workspaceMembers: Connection<WorkspaceMemberRow> };

  for (const edge of workspaceMembers?.edges ?? []) {
    memberNameById.set(edge.node.id, formatMemberName(edge.node.name));
  }

  return memberNameById;
};
