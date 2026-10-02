import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { readIssueBoardMetadataIds } from './read-issue-board-metadata-ids.util';

// Builds the per-project Kanban the fork created from a post-hook and this app
// was believed unable to reproduce (DEPLOY.md 5.4): a KANBAN view over issue,
// grouped by status, filtered to one project, with a column per status of that
// project.
//
// Created WITHOUT an applicationId, so it lands in the workspace's own
// `Custom` application. A view the app owned would be part of the app's
// manifest surface, and the next `twenty apply` deletes whatever the manifest
// does not declare.
export const createProjectBoardView = async ({
  client,
  projectId,
}: {
  client: ApiClient;
  projectId: string;
}): Promise<{
  viewId: string;
  columnCount: number;
  replacedViewIds: string[];
}> => {
  const projectName = await readProjectName(client, projectId);
  const {
    objectMetadataId,
    statusFieldId,
    projectFieldId,
    appFieldId,
    storyPointsFieldId,
    cardFieldIds,
  } = await readIssueBoardMetadataIds();
  const appId = await readProjectAppId(client, projectId);

  const metadataClient = new MetadataApiClient({ runAs: 'application' });

  // Rebuild, not pile up: running this twice on a project must leave one board,
  // not two boards with the same name and different shapes. Previous boards are
  // recognised by the filter that makes them this project's, so a view somebody
  // built by hand for another project is left alone.
  const replacedViewIds = await deleteExistingProjectBoardViews({
    metadataClient,
    objectMetadataId,
    projectFieldId,
    projectId,
  });

  const { createView: view } = await metadataClient.mutation({
    createView: {
      __args: {
        input: {
          name: `${projectName} board`,
          objectMetadataId,
          // Ahead of the engine INDEX view, so an object menu entry resolves to
          // a board that carries a project and an app and can therefore
          // create. There is no workspace-wide board on purpose: without a
          // project and app filter a new card arrives with neither and the
          // row-level predicate refuses the write.
          position: 0,
          type: 'KANBAN',
          icon: 'IconLayoutKanban',
          mainGroupByFieldMetadataId: statusFieldId,
          // Roomy cards with the aggregate the team plans by: every project
          // board shares this shape so boards do not read differently.
          isCompact: false,
          kanbanColumnWidth: 280,
          shouldHideEmptyGroups: false,
          kanbanAggregateOperation: 'SUM',
          kanbanAggregateOperationFieldMetadataId: storyPointsFieldId,
        },
      },
      id: true,
    },
  });

  const viewId = view?.id;

  if (typeof viewId !== 'string') {
    throw new Error('View was not created');
  }

  await metadataClient.mutation({
    createViewFilter: {
      __args: {
        input: {
          viewId,
          fieldMetadataId: projectFieldId,
          operand: 'IS',
          // Relation filters carry the selection object the front sends, and
          // it is also what seeds a new record created from this view.
          value: {
            isCurrentWorkspaceMemberSelected: false,
            selectedRecordIds: [projectId],
          },
        },
      },
      id: true,
    },
  });

  // Two filters, not one. `project` alone would seed a new card with a project
  // but no app, and the row-level predicate refuses a row whose app the member
  // does not hold — the record has to arrive already in scope.
  if (appId !== null) {
    await metadataClient.mutation({
      createViewFilter: {
        __args: {
          input: {
            viewId,
            fieldMetadataId: appFieldId,
            operand: 'IS',
            value: {
              isCurrentWorkspaceMemberSelected: false,
              selectedRecordIds: [appId],
            },
          },
        },
        id: true,
      },
    });
  }

  // A view created through the API carries no fields, and a board with no
  // fields draws nothing but the title. Same five chips as the shared board.
  await metadataClient.mutation({
    createManyViewFields: {
      __args: {
        inputs: cardFieldIds.map((fieldMetadataId, position) => ({
          viewId,
          fieldMetadataId,
          position,
          isVisible: true,
        })),
      },
      id: true,
    },
  });

  const statusIds = await listProjectStatusIds(client, projectId);

  for (const [index, statusId] of statusIds.entries()) {
    await metadataClient.mutation({
      createViewGroup: {
        __args: {
          input: { viewId, fieldValue: statusId, position: index, isVisible: true },
        },
        id: true,
      },
    });
  }

  return { viewId, columnCount: statusIds.length, replacedViewIds };
};

const deleteExistingProjectBoardViews = async ({
  metadataClient,
  objectMetadataId,
  projectFieldId,
  projectId,
}: {
  metadataClient: MetadataApiClient;
  objectMetadataId: string;
  projectFieldId: string;
  projectId: string;
}): Promise<string[]> => {
  const { getViews: views } = await metadataClient.query({
    getViews: {
      __args: { objectMetadataId, viewTypes: ['KANBAN'] },
      id: true,
    },
  });

  const deletedViewIds: string[] = [];

  for (const view of (views ?? []) as { id?: string | null }[]) {
    const viewId = view?.id;

    if (typeof viewId !== 'string') {
      continue;
    }

    const { getViewFilters: viewFilters } = await metadataClient.query({
      getViewFilters: {
        __args: { viewId },
        id: true,
        fieldMetadataId: true,
        value: true,
      },
    });

    const isThisProjectBoard = (
      (viewFilters ?? []) as { fieldMetadataId?: string | null; value?: unknown }[]
    ).some(
      (viewFilter) =>
        viewFilter?.fieldMetadataId === projectFieldId &&
        JSON.stringify(viewFilter?.value ?? '').includes(projectId),
    );

    if (!isThisProjectBoard) {
      continue;
    }

    // `deleteView` answers a boolean, so it takes no selection set.
    await metadataClient.mutation({
      deleteView: { __args: { id: viewId } },
    });
    deletedViewIds.push(viewId);
  }

  return deletedViewIds;
};

const readProjectName = async (
  client: ApiClient,
  projectId: string,
): Promise<string> => {
  const result = await client.query({
    projects: {
      __args: { filter: { id: { eq: projectId } }, first: 1 },
      edges: { node: { id: true, name: true } },
    },
  });

  const connection = result?.projects as
    | Connection<{ id: string; name?: string | null }>
    | undefined;

  return connection?.edges?.[0]?.node?.name ?? 'Project';
};

const readProjectAppId = async (
  client: ApiClient,
  projectId: string,
): Promise<string | null> => {
  const result = await client.query({
    projects: {
      __args: { filter: { id: { eq: projectId } }, first: 1 },
      edges: { node: { id: true, appId: true } },
    },
  });

  const connection = result?.projects as
    | Connection<{ id: string; appId?: string | null }>
    | undefined;

  return connection?.edges?.[0]?.node?.appId ?? null;
};

const listProjectStatusIds = async (
  client: ApiClient,
  projectId: string,
): Promise<string[]> => {
  const result = await client.query({
    issueStatuses: {
      __args: {
        filter: { projectId: { eq: projectId } },
        first: 100,
        orderBy: [{ position: 'AscNullsLast' }],
      },
      edges: { node: { id: true } },
    },
  });

  const connection = result?.issueStatuses as
    | Connection<{ id: string }>
    | undefined;

  return (connection?.edges ?? []).map((edge) => edge.node.id);
};
