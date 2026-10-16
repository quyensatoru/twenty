import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import {
  type IssueRow,
  type IssueStatusRow,
} from '../../types/task-manager-rows';
import { toDateInputValue } from './sprint-dates.util';

export type TaskTodaySuggestion = {
  issue: IssueRow;
  reason: 'overdue' | 'today';
};

const readPriorityRank = (priority: IssueRow['priority']): number =>
  ISSUE_PRIORITY_OPTIONS.find((option) => option.value === priority)
    ?.position ?? -1;

// The issue My work suggests starting with: the one overdue the longest, then
// the most pressing of what is due today, higher priority breaking ties.
// `day` is the page's own day, so due dates are compared the way the rows
// label them.
export const pickTaskTodaySuggestion = ({
  issues,
  issueStatuses,
  day,
}: {
  issues: IssueRow[];
  issueStatuses: IssueStatusRow[];
  day: string;
}): TaskTodaySuggestion | null => {
  const doneStatusIds = new Set(
    issueStatuses
      .filter((status) => status.category === 'DONE')
      .map((status) => status.id),
  );
  const candidates = issues
    .filter(
      (issue) =>
        typeof issue.statusId !== 'string' ||
        !doneStatusIds.has(issue.statusId),
    )
    .map((issue) => ({ issue, dueDay: toDateInputValue(issue.dueDate) }))
    .filter(({ dueDay }) => dueDay !== '' && dueDay <= day)
    .sort(
      (first, second) =>
        first.dueDay.localeCompare(second.dueDay) ||
        readPriorityRank(second.issue.priority) -
          readPriorityRank(first.issue.priority),
    );
  const first = candidates[0];

  if (first === undefined) {
    return null;
  }

  return {
    issue: first.issue,
    reason: first.dueDay < day ? 'overdue' : 'today',
  };
};
