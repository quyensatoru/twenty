import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// "Done" is per project: the statuses whose category is DONE.
export const listDoneStatusIds = async ({
  client,
  projectId,
}: {
  client: ApiClient;
  projectId: string;
}): Promise<string[]> => {
  const result = await client.query({
    issueStatuses: {
      __args: {
        filter: { projectId: { eq: projectId }, category: { eq: 'DONE' } },
        first: 100,
      },
      edges: { node: { id: true } },
    },
  });

  const connection = result?.issueStatuses as
    | Connection<{ id: string }>
    | undefined;

  return (connection?.edges ?? []).map((edge) => edge.node.id);
};
