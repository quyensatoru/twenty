import { BOARD_COLUMN_PAGE_SIZE } from '../../constants/board-column-page-size';
import { type ApiClient } from '../../types/api-client';
import { type BoardIssueQuery } from './build-board-issue-filters.util';
import {
  buildBacklogSectionFilter,
  unfilterBoardIssueQuery,
} from './build-backlog-section-filter.util';
import { fetchIssuePage, type IssuePage } from './fetch-issue-page.util';
import { listScopedRecords } from './list-scoped-records.util';

export const fetchBacklogSectionPage = ({
  client,
  query,
  sprintId,
  doneStatusIds,
  after,
}: {
  client: ApiClient;
  query: BoardIssueQuery;
  sprintId: string | null;
  doneStatusIds: readonly string[];
  after?: string | null;
}): Promise<IssuePage> =>
  fetchIssuePage({
    client,
    filter: buildBacklogSectionFilter({ query, sprintId, doneStatusIds }),
    first: BOARD_COLUMN_PAGE_SIZE,
    after,
  });

// Count and story points of the whole section, from the connection's own
// aggregates: summing the loaded rows would only cover the first page.
export const fetchBacklogSectionTotals = async ({
  client,
  query,
  sprintId,
  doneStatusIds,
}: {
  client: ApiClient;
  query: BoardIssueQuery;
  sprintId: string | null;
  doneStatusIds: readonly string[];
}): Promise<{ unfilteredCount: number; storyPointTotal: number }> => {
  const result = await client.query({
    issues: {
      __args: {
        filter: buildBacklogSectionFilter({
          query: unfilterBoardIssueQuery(query),
          sprintId,
          doneStatusIds,
        }),
        first: 1,
      },
      totalCount: true,
      sumStoryPoints: true,
    },
  });
  const connection = result?.issues as
    | { totalCount?: number; sumStoryPoints?: number | null }
    | undefined;

  return {
    unfilteredCount: connection?.totalCount ?? 0,
    storyPointTotal: connection?.sumStoryPoints ?? 0,
  };
};

// How many subtasks each listed parent has, for the row badge.
export const listSubtaskCounts = async ({
  client,
  parentIds,
}: {
  client: ApiClient;
  parentIds: readonly string[];
}): Promise<Record<string, number>> => {
  if (parentIds.length === 0) {
    return {};
  }

  const subtasks = await listScopedRecords<{ parentId?: string | null }>({
    client,
    pluralName: 'issues',
    filter: { parentId: { in: [...parentIds] } },
    selection: { id: true, parentId: true },
  });

  return subtasks.reduce<Record<string, number>>((counts, subtask) => {
    if (typeof subtask.parentId === 'string') {
      counts[subtask.parentId] = (counts[subtask.parentId] ?? 0) + 1;
    }

    return counts;
  }, {});
};
