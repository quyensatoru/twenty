import { type ApiClient } from '../../types/api-client';
import { hasIssueKey } from '../../utils/build-issue-key.util';
import { writeWithReservedIssueKey } from './write-with-reserved-issue-key.util';

export const createIssueWithReservedKey = async ({
  client,
  projectId,
  data,
  selection,
}: {
  client: ApiClient;
  projectId: string | null | undefined;
  data: Record<string, unknown>;
  selection: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
  const createIssue = async (issueKey: string | null) => {
    const result = await client.mutation({
      createIssue: {
        __args: { data: issueKey === null ? data : { ...data, issueKey } },
        ...selection,
      },
    });

    return result?.createIssue;
  };

  if (
    hasIssueKey(data.issueKey as string | null | undefined) ||
    typeof projectId !== 'string'
  ) {
    return createIssue(null);
  }

  return writeWithReservedIssueKey({ client, projectId, write: createIssue });
};
