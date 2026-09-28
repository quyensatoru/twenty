import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

export type IssueNumberReservation = { key: string; firstIssueNumber: number };

type ProjectCounterNode = {
  key?: string | null;
  nextIssueNumber?: number | null;
};

// The fork bumped this counter with a single `UPDATE ... RETURNING`, which is
// atomic under concurrency. An app has no raw SQL and no transaction handle:
// read-then-write here is NOT atomic, so two simultaneous creates can reserve
// the same number. The unique index on `issue.issueKey` is what actually
// guarantees correctness — a loser gets a unique violation and
// createIssueWithReservedKey retries with a higher `attempt`, which offsets
// the reservation past the collision. `nextIssueNumber` holds the last number
// handed out.
export const reserveProjectIssueNumbers = async ({
  client,
  projectId,
  count,
  attempt = 0,
}: {
  client: ApiClient;
  projectId: string;
  count: number;
  attempt?: number;
}): Promise<IssueNumberReservation | null> => {
  const result = await client.query({
    projects: {
      __args: { filter: { id: { eq: projectId } }, first: 1 },
      edges: { node: { id: true, key: true, nextIssueNumber: true } },
    },
  });

  const connection = result?.projects as
    | Connection<ProjectCounterNode>
    | undefined;
  const project = connection?.edges?.[0]?.node;

  if (project === undefined || typeof project.key !== 'string') {
    return null;
  }

  const lastIssueNumber =
    typeof project.nextIssueNumber === 'number' ? project.nextIssueNumber : 0;
  const firstIssueNumber = lastIssueNumber + 1 + attempt * count;

  await client.mutation({
    updateProject: {
      __args: {
        id: projectId,
        data: { nextIssueNumber: firstIssueNumber + count - 1 },
      },
      id: true,
    },
  });

  return { key: project.key, firstIssueNumber };
};
