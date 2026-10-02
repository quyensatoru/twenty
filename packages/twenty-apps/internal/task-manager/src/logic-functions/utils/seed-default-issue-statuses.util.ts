import { DEFAULT_ISSUE_STATUSES } from '../../constants/default-issue-statuses';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// Idempotent: a project that already has statuses is left alone, so a retried
// create never doubles them. The per-project Kanban built by the
// project.created trigger takes one column per status below.
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
