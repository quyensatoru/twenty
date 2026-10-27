import { PLANNED_STATUS_NAME } from '../../constants/product-backlog';
import { type ApiClient } from '../../types/api-client';
import { type IssueStage } from '../../types/product-backlog';
import { resolveEffectiveAppId } from '../app-scope/resolve-effective-app-id.util';
import { listScopedRecords } from './list-scoped-records.util';

type StatusRow = {
  id: string;
  name?: string | null;
  category?: string | null;
  position?: number | null;
};

const UPDATE_CHUNK_SIZE = 100;

export const listProjectStatuses = (
  client: ApiClient,
  projectId: string,
): Promise<StatusRow[]> =>
  listScopedRecords<StatusRow>({
    client,
    pluralName: 'issueStatuses',
    filter: { projectId: { eq: projectId } },
    selection: { id: true, name: true, category: true, position: true },
  });

// The column an item lands in when it reaches the Board. Created in front of
// the project's other columns the first time it is needed.
export const ensurePlannedStatusId = async (
  client: ApiClient,
  projectId: string,
): Promise<string> => {
  const statuses = await listProjectStatuses(client, projectId);
  const existing = statuses.find(
    (status) => status.name?.trim().toUpperCase() === PLANNED_STATUS_NAME,
  );

  if (existing !== undefined) {
    return existing.id;
  }

  const firstPosition = statuses.reduce(
    (lowest, status) => Math.min(lowest, status.position ?? 0),
    0,
  );
  const appId = await resolveEffectiveAppId({
    client,
    objectNameSingular: 'issueStatus',
    immediateForeignKeyValue: projectId,
  });
  const result = await client.mutation({
    createIssueStatus: {
      __args: {
        data: {
          projectId,
          appId,
          name: PLANNED_STATUS_NAME,
          category: 'UNSTARTED',
          color: 'SKY',
          position: firstPosition - 1,
        },
      },
      id: true,
    },
  });
  const statusId = (result?.createIssueStatus as { id?: string } | undefined)
    ?.id;

  if (typeof statusId !== 'string') {
    throw new Error('The PLANNED status could not be created.');
  }

  return statusId;
};

// One bulk write per chunk rather than one per issue: moving a sprint or
// migrating a project touches hundreds of rows.
export const updateIssuesById = async (
  client: ApiClient,
  issueIds: readonly string[],
  data: Record<string, unknown>,
): Promise<void> => {
  for (let index = 0; index < issueIds.length; index += UPDATE_CHUNK_SIZE) {
    const chunk = issueIds.slice(index, index + UPDATE_CHUNK_SIZE);

    await client.mutation({
      updateIssues: {
        __args: { filter: { id: { in: chunk } }, data },
        id: true,
      },
    });
  }
};

// Subtasks have no stage of their own: they follow their parent everywhere.
export const listSubtaskIds = async (
  client: ApiClient,
  parentIds: readonly string[],
): Promise<string[]> =>
  parentIds.length === 0
    ? []
    : (
        await listScopedRecords<{ id: string }>({
          client,
          pluralName: 'issues',
          filter: { parentId: { in: [...parentIds] } },
          selection: { id: true },
        })
      ).map((subtask) => subtask.id);

export const moveIssueFamiliesToStage = async ({
  client,
  issueIds,
  stage,
  extraData = {},
}: {
  client: ApiClient;
  issueIds: readonly string[];
  stage: IssueStage;
  extraData?: Record<string, unknown>;
}): Promise<void> => {
  if (issueIds.length === 0) {
    return;
  }

  const subtaskIds = await listSubtaskIds(client, issueIds);

  await updateIssuesById(client, issueIds, { stage, ...extraData });

  // A pushed parent drags its subtasks into the same column and sprint.
  await updateIssuesById(client, subtaskIds, {
    stage,
    ...('sprintId' in extraData ? { sprintId: extraData.sprintId } : {}),
  });
};
