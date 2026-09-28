import { DEFAULT_ISSUE_STATUSES } from '../../constants/default-issue-statuses';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// Idempotent: a project that already has statuses is left alone, so a retried
// create never doubles them. The fork paired this with a per-project Kanban
// view whose groups it kept in sync; an app cannot create views at runtime, so
// the shipped `By Status` Kanban groups on the status relation instead and
// picks up new statuses on its own (see src/views/issues-by-status.view.ts).
export const seedDefaultIssueStatuses = async ({
  client,
  projectId,
}: {
  client: ApiClient;
  projectId: string;
}): Promise<{ id: string; name: string; position: number }[]> => {
  const existing = await client.query({
    issueStatuses: {
      __args: { filter: { projectId: { eq: projectId } }, first: 100 },
      edges: { node: { id: true, name: true, position: true } },
    },
  });

  const connection = existing?.issueStatuses as
    | Connection<{ id: string; name: string; position: number }>
    | undefined;
  const existingStatuses = (connection?.edges ?? []).map((edge) => edge.node);

  if (existingStatuses.length > 0) {
    return existingStatuses;
  }

  const created: { id: string; name: string; position: number }[] = [];

  for (const [index, status] of DEFAULT_ISSUE_STATUSES.entries()) {
    const result = await client.mutation({
      createIssueStatus: {
        __args: {
          data: {
            name: status.name,
            color: status.color,
            category: status.category,
            position: index,
            projectId,
          },
        },
        id: true,
        name: true,
        position: true,
      },
    });

    if (result?.createIssueStatus !== undefined) {
      created.push(result.createIssueStatus);
    }
  }

  return created;
};
