import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { readProductBacklogMigratedAt } from '../../utils/read-product-backlog-settings.util';
import { listScopedRecords } from './list-scoped-records.util';
import {
  listProjectStatuses,
  listSubtaskIds,
  updateIssuesById,
} from './product-backlog-stage.util';

export const readStoredProductBacklogSettings = async (
  client: ApiClient,
  projectId: string,
): Promise<Record<string, unknown>> => {
  const result = await client.query({
    projects: {
      __args: { filter: { id: { eq: projectId } }, first: 1 },
      edges: { node: { id: true, productBacklogSettings: true } },
    },
  });
  const stored = (
    result?.projects as
      Connection<{ id: string; productBacklogSettings?: unknown }> | undefined
  )?.edges?.[0]?.node?.productBacklogSettings;

  return typeof stored === 'object' && stored !== null && !Array.isArray(stored)
    ? (stored as Record<string, unknown>)
    : {};
};

// Runs once per project, the first time the Product Backlog sees it: work
// nobody has started and no sprint holds is backlog material, so it leaves the
// Board and becomes items. Everything else stays where it is.
export const migrateProjectToProductBacklog = async (
  client: ApiClient,
  projectId: string,
): Promise<{ migratedItemCount: number }> => {
  const stored = await readStoredProductBacklogSettings(client, projectId);

  if (readProductBacklogMigratedAt(stored) !== null) {
    return { migratedItemCount: 0 };
  }

  const unstartedStatusIds = (await listProjectStatuses(client, projectId))
    .filter((status) => status.category === 'UNSTARTED')
    .map((status) => status.id);
  const itemIds = (
    await listScopedRecords<{ id: string }>({
      client,
      pluralName: 'issues',
      filter: {
        and: [
          { projectId: { eq: projectId } },
          { parentId: { is: 'NULL' } },
          { sprintId: { is: 'NULL' } },
          { stage: { eq: 'ISSUE' } },
          {
            or: [
              { statusId: { is: 'NULL' } },
              ...(unstartedStatusIds.length === 0
                ? []
                : [{ statusId: { in: unstartedStatusIds } }]),
            ],
          },
        ],
      },
      selection: { id: true },
    })
  ).map((issue) => issue.id);

  await updateIssuesById(client, itemIds, { stage: 'ITEM' });
  await updateIssuesById(client, await listSubtaskIds(client, itemIds), {
    stage: 'ITEM',
  });

  await client.mutation({
    updateProject: {
      __args: {
        id: projectId,
        data: {
          productBacklogSettings: {
            ...stored,
            migratedAt: new Date().toISOString(),
          },
        },
      },
      id: true,
    },
  });

  return { migratedItemCount: itemIds.length };
};
