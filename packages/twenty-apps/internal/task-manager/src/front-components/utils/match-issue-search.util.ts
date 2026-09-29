import { type IssueRow } from '../../types/task-manager-rows';

// Matches the fork's search box: key or title, case-insensitive, substring.
// Runs over the issues the route already returned rather than re-querying, so
// filtering is instant and needs no round trip.
export const matchIssueSearch = (issue: IssueRow, search: string): boolean => {
  const term = search.trim().toLowerCase();

  if (term === '') {
    return true;
  }

  return (
    (issue.issueKey ?? '').toLowerCase().includes(term) ||
    (issue.title ?? '').toLowerCase().includes(term)
  );
};
