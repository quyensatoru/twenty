import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// The ORM query builder rejects SQL expressions in SET, so the counter is
// bumped with raw SQL: a single UPDATE ... RETURNING stays atomic under
// concurrent issue creation. `nextIssueNumber` holds the last number handed
// out. Must run inside executeInWorkspaceContext.
export const reserveProjectIssueNumbers = async ({
  workspaceOrmManager,
  workspaceId,
  projectId,
  count,
}: {
  workspaceOrmManager: WorkspaceOrmManager;
  workspaceId: string;
  projectId: string;
  count: number;
}): Promise<{ key: string; firstIssueNumber: number } | null> => {
  const rows = await workspaceOrmManager.runInWorkspaceTransaction(
    (transactionScope) =>
      transactionScope.executeRawQuery(
        `UPDATE "${getWorkspaceSchemaName(workspaceId)}"."project"
         SET "nextIssueNumber" = COALESCE("nextIssueNumber", 0) + $2
         WHERE id = $1
         RETURNING "nextIssueNumber", "key"`,
        [projectId, count],
      ),
  );

  const project = rows[0];

  if (!isDefined(project)) {
    return null;
  }

  return {
    key: String(project.key),
    firstIssueNumber: Number(project.nextIssueNumber) - count + 1,
  };
};
