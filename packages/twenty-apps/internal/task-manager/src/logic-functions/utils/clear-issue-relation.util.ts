import { type ApiClient } from '../../types/api-client';
import { listScopedRecords } from './list-scoped-records.util';

// Deletes here are soft, so the relation's SET_NULL never fires: issues would
// keep pointing at a sprint or epic nobody can see any more. The route clears
// the column itself before deleting, which is what Jira does when a sprint is
// deleted (its issues go back to the backlog).
export const clearIssueRelation = async ({
  client,
  columnName,
  recordId,
}: {
  client: ApiClient;
  columnName: 'sprintId' | 'epicId';
  recordId: string;
}): Promise<number> => {
  const issues = await listScopedRecords<{ id: string }>({
    client,
    pluralName: 'issues',
    filter: { [columnName]: { eq: recordId } },
    selection: { id: true },
  });

  for (const issue of issues) {
    await client.mutation({
      updateIssue: {
        __args: { id: issue.id, data: { [columnName]: null } },
        id: true,
      },
    });
  }

  return issues.length;
};
