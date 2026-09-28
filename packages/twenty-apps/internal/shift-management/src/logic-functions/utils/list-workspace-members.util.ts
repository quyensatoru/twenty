import { MEMBER_QUERY_LIMIT } from '../../constants/query-limits';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type ShiftMember } from '../../types/shift-member';
import { formatMemberName } from '../../utils/format-member-name.util';

type WorkspaceMemberRow = {
  id: string;
  userEmail: string | null;
  name: { firstName?: string | null; lastName?: string | null } | null;
};

// Feeds the Report page's member picker, which only a Leader/PO ever sees.
export const listWorkspaceMembers = async (
  client: ApiClient,
): Promise<ShiftMember[]> => {
  const { workspaceMembers } = (await client.query({
    workspaceMembers: {
      __args: { first: MEMBER_QUERY_LIMIT },
      edges: {
        node: {
          id: true,
          userEmail: true,
          name: { firstName: true, lastName: true },
        },
      },
    },
  })) as { workspaceMembers: Connection<WorkspaceMemberRow> };

  return (workspaceMembers?.edges ?? []).map((edge) => ({
    id: edge.node.id,
    name: formatMemberName(edge.node.name),
    email: edge.node.userEmail,
  }));
};
