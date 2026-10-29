import { type ApiClient } from '../../types/api-client';
import { isBacklogStatusName } from '../../utils/is-backlog-status-name.util';
import { readBacklogColumnMigration } from '../../utils/read-product-backlog-settings.util';
import { listScopedRecords } from './list-scoped-records.util';
import { readStoredProductBacklogSettings } from './migrate-project-to-product-backlog.util';
import {
  ensurePlannedStatusId,
  listProjectStatuses,
  listSubtaskIds,
  updateIssuesById,
} from './product-backlog-stage.util';
import { recordIssueHistories } from './record-issue-histories.util';

type BacklogColumnIssue = {
  id: string;
  issueKey?: string | null;
  sprintId?: string | null;
  position?: number | null;
  appId?: string | null;
};

// V1.4 drops the Board's Backlog column; the rules and the rollback log are in
// DEPLOY.md, section 9 "V1.4". Once per project.
export const migrateBacklogColumnToItems = async (
  client: ApiClient,
  projectId: string,
): Promise<{ migratedIssueKeys: string[] }> => {
  const stored = await readStoredProductBacklogSettings(client, projectId);

  if (readBacklogColumnMigration(stored) !== null) {
    return { migratedIssueKeys: [] };
  }

  const backlogStatusIds = (await listProjectStatuses(client, projectId))
    .filter((status) => isBacklogStatusName(status.name))
    .map((status) => status.id);
  const [columnIssues, sprints, lastItems]: [
    BacklogColumnIssue[],
    { id: string; state?: string | null }[],
    { id: string; position?: number | null }[],
  ] =
    backlogStatusIds.length === 0
      ? [[], [], []]
      : await Promise.all([
          listScopedRecords<BacklogColumnIssue>({
            client,
            pluralName: 'issues',
            filter: {
              projectId: { eq: projectId },
              parentId: { is: 'NULL' },
              stage: { eq: 'ISSUE' },
              statusId: { in: backlogStatusIds },
            },
            selection: {
              id: true,
              issueKey: true,
              sprintId: true,
              position: true,
              appId: true,
            },
            orderBy: [{ position: 'AscNullsLast' }],
          }),
          listScopedRecords<{ id: string; state?: string | null }>({
            client,
            pluralName: 'sprints',
            filter: { projectId: { eq: projectId } },
            selection: { id: true, state: true },
          }),
          listScopedRecords<{ id: string; position?: number | null }>({
            client,
            pluralName: 'issues',
            filter: {
              projectId: { eq: projectId },
              parentId: { is: 'NULL' },
              stage: { eq: 'ITEM' },
            },
            selection: { id: true, position: true },
          }),
        ]);

  const keptSprintIds = new Set(
    sprints
      .filter((sprint) => sprint.state === 'FUTURE' || sprint.state === null)
      .map((sprint) => sprint.id),
  );
  const lastPosition = lastItems.reduce(
    (highest, item) => Math.max(highest, item.position ?? 0),
    0,
  );
  const movedIssues = columnIssues.map((issue, index) => ({
    ...issue,
    nextPosition: lastPosition + index + 1,
    isLeavingSprint:
      typeof issue.sprintId === 'string' && !keptSprintIds.has(issue.sprintId),
  }));

  for (const issue of movedIssues) {
    await client.mutation({
      updateIssue: {
        __args: {
          id: issue.id,
          data: {
            stage: 'ITEM',
            position: issue.nextPosition,
            ...(issue.isLeavingSprint ? { sprintId: null } : {}),
          },
        },
        id: true,
      },
    });
  }

  const leavingSprintIds = movedIssues
    .filter((issue) => issue.isLeavingSprint)
    .map((issue) => issue.id);
  const stayingSprintIds = movedIssues
    .filter((issue) => !issue.isLeavingSprint)
    .map((issue) => issue.id);

  await updateIssuesById(
    client,
    await listSubtaskIds(client, leavingSprintIds),
    { stage: 'ITEM', sprintId: null },
  );
  await updateIssuesById(
    client,
    await listSubtaskIds(client, stayingSprintIds),
    { stage: 'ITEM' },
  );

  const strandedSubtasks =
    backlogStatusIds.length === 0
      ? []
      : await listScopedRecords<{
          id: string;
          issueKey?: string | null;
          statusId?: string | null;
        }>({
          client,
          pluralName: 'issues',
          filter: {
            projectId: { eq: projectId },
            parentId: { is: 'NOT_NULL' },
            stage: { eq: 'ISSUE' },
            statusId: { in: backlogStatusIds },
          },
          selection: { id: true, issueKey: true, statusId: true },
        });
  const plannedStatusId = await ensurePlannedStatusId(client, projectId);

  await updateIssuesById(
    client,
    strandedSubtasks.map((subtask) => subtask.id),
    { statusId: plannedStatusId },
  );

  await recordIssueHistories({
    client,
    issues: movedIssues,
    action: 'moved-from-backlog-column',
    authorId: null,
  });

  const migration = {
    migratedAt: new Date().toISOString(),
    issues: movedIssues.map((issue) => ({
      id: issue.id,
      issueKey: issue.issueKey ?? null,
      previousSprintId: issue.sprintId ?? null,
      previousPosition: issue.position ?? null,
    })),
    subtasks: strandedSubtasks.map((subtask) => ({
      id: subtask.id,
      issueKey: subtask.issueKey ?? null,
      previousStatusId: subtask.statusId ?? null,
    })),
  };

  await client.mutation({
    updateProject: {
      __args: {
        id: projectId,
        data: {
          productBacklogSettings: {
            ...stored,
            backlogColumnMigration: migration,
          },
        },
      },
      id: true,
    },
  });

  return {
    migratedIssueKeys: movedIssues.map((issue) => issue.issueKey ?? issue.id),
  };
};
