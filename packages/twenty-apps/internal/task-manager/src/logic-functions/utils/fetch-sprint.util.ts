import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

export type SprintRecord = {
  id: string;
  name?: string | null;
  state?: string | null;
  projectId?: string | null;
};

export const fetchSprint = async (
  client: ApiClient,
  sprintId: string,
): Promise<SprintRecord | null> => {
  const result = await client.query({
    sprints: {
      __args: { filter: { id: { eq: sprintId } }, first: 1 },
      edges: { node: { id: true, name: true, state: true, projectId: true } },
    },
  });

  return (
    (result?.sprints as Connection<SprintRecord> | undefined)?.edges?.[0]
      ?.node ?? null
  );
};
