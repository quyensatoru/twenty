import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

export const findActiveSprintId = async ({
  client,
  projectId,
}: {
  client: ApiClient;
  projectId: string;
}): Promise<string | null> => {
  const result = await client.query({
    sprints: {
      __args: {
        filter: { projectId: { eq: projectId }, state: { eq: 'ACTIVE' } },
        first: 1,
        orderBy: [{ position: 'AscNullsLast' }],
      },
      edges: { node: { id: true } },
    },
  });

  return (
    (result?.sprints as Connection<{ id: string }> | undefined)?.edges?.[0]
      ?.node.id ?? null
  );
};
