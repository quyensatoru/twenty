// The fields a board column can be ordered by. An empty sort is the manual
// position the backlog ranks issues by, which is also what the board showed
// before sorting existed.
export const BOARD_ISSUE_SORT_FIELDS = [
  'priority',
  'createdAt',
  'updatedAt',
  'dueDate',
  'storyPoints',
] as const;

export type BoardIssueSortField = (typeof BOARD_ISSUE_SORT_FIELDS)[number];

export type BoardIssueSortDirection = 'asc' | 'desc';

export type BoardIssueSortRule = {
  field: BoardIssueSortField;
  direction: BoardIssueSortDirection;
};

// Applied in order: a later rule only decides between issues the earlier
// ones tie on.
export type BoardIssueSort = BoardIssueSortRule[];

export const MAX_BOARD_ISSUE_SORT_RULES = 3;

// The direction a field opens in: most urgent, newest or biggest first, and
// the closest deadline first.
export const BOARD_ISSUE_SORT_DEFAULT_DIRECTIONS: Record<
  BoardIssueSortField,
  BoardIssueSortDirection
> = {
  priority: 'desc',
  createdAt: 'desc',
  updatedAt: 'desc',
  dueDate: 'asc',
  storyPoints: 'desc',
};
