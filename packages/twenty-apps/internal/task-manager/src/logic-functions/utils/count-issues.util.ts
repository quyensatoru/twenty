import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// A count, not a read: one row is asked for and only the total is used.
export const countIssues = async (
  client: ApiClient,
  filter: Record<string, unknown>,
): Promise<number> => {
  const result = await client.query({
    issues: { __args: { filter, first: 1 }, totalCount: true },
  });

  return (result?.issues as Connection<unknown> | undefined)?.totalCount ?? 0;
};
