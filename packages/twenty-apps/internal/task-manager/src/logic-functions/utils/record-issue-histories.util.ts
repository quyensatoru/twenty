import { type ApiClient } from '../../types/api-client';

// One History entry per issue for an event the app itself causes. An issue
// without an app is skipped: its entry would be invisible to everyone.
export const recordIssueHistories = async ({
  client,
  issues,
  action,
  authorId,
}: {
  client: ApiClient;
  issues: readonly { id: string; appId?: string | null }[];
  action: string;
  authorId: string | null;
}): Promise<void> => {
  const entries = issues
    .filter((issue) => typeof issue.appId === 'string')
    .map((issue) => ({
      issueId: issue.id,
      action,
      authorId,
      appId: issue.appId,
    }));

  if (entries.length === 0) {
    return;
  }

  await client.mutation({
    createIssueHistories: { __args: { data: entries }, id: true },
  });
};
