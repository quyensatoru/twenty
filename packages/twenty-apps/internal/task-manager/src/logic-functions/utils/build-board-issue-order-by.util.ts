import { type BoardIssueSort } from '../../constants/board-issue-sorts';

export type IssueOrderByEntry = Record<
  string,
  'AscNullsLast' | 'DescNullsLast'
>;

// Pinned issues head their column whatever the sort, the latest pin first.
// Unsorted, a column follows the manual order its cards are dragged into,
// newest first among equals. Columns page by cursor, so ties need a total
// order ending on the id, or two equal issues could swap between pages.
// Empty values go last in both directions.
export const buildBoardIssueOrderBy = (
  sort: BoardIssueSort,
): IssueOrderByEntry[] => [
  { pinnedAt: 'DescNullsLast' },
  ...(sort.length > 0
    ? [
        ...sort.map(({ field, direction }): IssueOrderByEntry => ({
          [field]: direction === 'asc' ? 'AscNullsLast' : 'DescNullsLast',
        })),
        { position: 'AscNullsLast' } as const,
      ]
    : [
        { position: 'AscNullsLast' } as const,
        { createdAt: 'DescNullsLast' } as const,
      ]),
  { id: 'AscNullsLast' },
];
