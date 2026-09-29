import { type ApiClient } from '../../types/api-client';
import { listScopedRecords } from './list-scoped-records.util';

type IssueLike = { assigneeId?: string | null; reporterId?: string | null };

// Names for the members an issue list refers to, resolved in one round trip so
// a board or backlog does not need a lookup per card.
export const listIssueMembers = async ({
  client,
  issues,
}: {
  client: ApiClient;
  issues: readonly IssueLike[];
}): Promise<unknown[]> => {
  const memberIds = [
    ...new Set(
      issues
        .flatMap((issue) => [issue.assigneeId, issue.reporterId])
        .filter((memberId): memberId is string => typeof memberId === 'string'),
    ),
  ];

  if (memberIds.length === 0) {
    return [];
  }

  return listScopedRecords({
    client,
    pluralName: 'workspaceMembers',
    filter: { id: { in: memberIds } },
    selection: {
      id: true,
      name: { firstName: true, lastName: true },
      avatarUrl: true,
    },
  });
};
