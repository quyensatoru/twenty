import { type BoardIssueSort } from '../../constants/board-issue-sorts';

export type IssueOrderByEntry = Record<
  string,
  'AscNullsLast' | 'DescNullsLast'
>;

// An unsorted board shows the newest issues first; the manual position only
// ranks the backlog.
const DEFAULT_BOARD_ISSUE_SORT: BoardIssueSort = [
  { field: 'createdAt', direction: 'desc' },
];

// Pinned issues head their column whatever the sort, the latest pin first.
// Columns page by cursor, so ties need a total order: without the manual
// position and the id, two issues equal on every rule could swap between
// pages and one would be skipped. Empty values go last in both directions: an
// issue with no due date is not the most urgent one.
export const buildBoardIssueOrderBy = (
  sort: BoardIssueSort,
): IssueOrderByEntry[] => [
  { pinnedAt: 'DescNullsLast' },
  ...(sort.length > 0 ? sort : DEFAULT_BOARD_ISSUE_SORT).map(
    ({ field, direction }): IssueOrderByEntry => ({
      [field]: direction === 'asc' ? 'AscNullsLast' : 'DescNullsLast',
    }),
  ),
  { position: 'AscNullsLast' },
  { id: 'AscNullsLast' },
];
