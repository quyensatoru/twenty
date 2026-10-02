import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// Stamped onto a tool's run envelope so the app behind the webhook can
// attribute a fire-and-forget job without asking the operator to type their
// own email as a tool field. Absent for a machine caller — there is no
// workspace member row to read it off.
export const resolveCallerEmail = async ({
  client,
  workspaceMemberId,
}: {
  client: ApiClient;
  workspaceMemberId: string | null;
}): Promise<string | null> => {
  if (workspaceMemberId === null) {
    return null;
  }

  const result = await client.query({
    workspaceMembers: {
      __args: { filter: { id: { eq: workspaceMemberId } }, first: 1 },
      edges: { node: { id: true, userEmail: true } },
    },
  });

  const connection = result?.workspaceMembers as
    | Connection<{ userEmail?: unknown }>
    | undefined;
  const userEmail = connection?.edges?.[0]?.node?.userEmail;

  return typeof userEmail === 'string' ? userEmail : null;
};
