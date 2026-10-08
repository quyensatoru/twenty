import {
  type BoardIssueQuery,
  buildBoardScopeFilter,
} from './build-board-issue-filters.util';

// One backlog section: the top-level issues of one sprint, or of none.
// Subtasks are counted on their parent's row rather than listed. The backlog
// section also leaves out finished work, as Jira's does; a sprint section
// keeps it, since a sprint's done issues are part of what it holds.
export const buildBacklogSectionFilter = ({
  query,
  sprintId,
  doneStatusIds,
}: {
  query: BoardIssueQuery;
  sprintId: string | null;
  doneStatusIds: readonly string[];
}): Record<string, unknown> => {
  const filters: Record<string, unknown>[] = [
    buildBoardScopeFilter({ ...query, sprintId }),
    { parentId: { is: 'NULL' } },
  ];

  if (sprintId === null && doneStatusIds.length > 0) {
    // NOT IN alone would drop the issues with no status: SQL compares NULL
    // to nothing.
    filters.push({
      or: [
        { statusId: { is: 'NULL' } },
        { not: { statusId: { in: [...doneStatusIds] } } },
      ],
    });
  }

  return { and: filters };
};

// The section as a whole, whatever the toolbar filters, for the header totals.
export const unfilterBoardIssueQuery = (
  query: BoardIssueQuery,
): BoardIssueQuery => ({
  ...query,
  assigneeIds: [],
  issueType: null,
  epicId: undefined,
});
