import { type BoardIssueSort } from '../../constants/board-issue-sorts';

type OrderByEntry = Record<string, 'AscNullsLast' | 'DescNullsLast'>;

// Columns page by cursor, so ties need a total order: without the manual
// position and the id, two issues equal on every rule could swap between
// pages and one would be skipped. Empty values go last in both directions: an
// issue with no due date is not the most urgent one.
export const buildBoardIssueOrderBy = (
  sort: BoardIssueSort,
): OrderByEntry[] => [
  ...sort.map(({ field, direction }): OrderByEntry => ({
    [field]: direction === 'asc' ? 'AscNullsLast' : 'DescNullsLast',
  })),
  { position: 'AscNullsLast' },
  { id: 'AscNullsLast' },
];
