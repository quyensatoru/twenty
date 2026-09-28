import { type IssueRow } from '../../types/task-manager-rows';
import { sortByPosition } from './sort-by-position.util';

const UNGROUPED_KEY = 'null';

// Groups issues by a foreign key, sorted by position within each group, with
// every declared group present even when empty — an empty Kanban column still
// has to render as a drop target.
export const groupIssuesBy = ({
  issues,
  groupKey,
  groupIds,
}: {
  issues: readonly IssueRow[];
  groupKey: 'statusId' | 'sprintId' | 'epicId';
  groupIds: readonly string[];
}): Map<string, IssueRow[]> => {
  const grouped = new Map<string, IssueRow[]>();

  grouped.set(
    UNGROUPED_KEY,
    sortByPosition(issues.filter((issue) => !issue[groupKey])),
  );

  for (const groupId of groupIds) {
    grouped.set(
      groupId,
      sortByPosition(issues.filter((issue) => issue[groupKey] === groupId)),
    );
  }

  return grouped;
};

export const UNGROUPED_GROUP_KEY = UNGROUPED_KEY;
