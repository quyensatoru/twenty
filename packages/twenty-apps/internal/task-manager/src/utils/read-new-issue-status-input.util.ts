import { ISSUE_STATUS_CATEGORY_OPTIONS } from '../constants/issue-status-category-options';
import { ISSUE_STATUS_COLOR_OPTIONS } from '../constants/issue-status-color-options';

export type IssueStatusCategory =
  (typeof ISSUE_STATUS_CATEGORY_OPTIONS)[number]['value'];

export type NewIssueStatusInput = {
  name: string;
  category: IssueStatusCategory;
  color: string;
};

// The same colours the default statuses get for these categories, so a status
// added from the board sits in with the ones every project starts with.
export const DEFAULT_ISSUE_STATUS_COLOR_BY_CATEGORY: Record<
  IssueStatusCategory,
  string
> = {
  UNSTARTED: 'GRAY',
  STARTED: 'PURPLE',
  DONE: 'GREEN',
};

const CATEGORY_VALUES = ISSUE_STATUS_CATEGORY_OPTIONS.map(
  (option) => option.value,
);

const COLOR_VALUES = new Set<string>(
  ISSUE_STATUS_COLOR_OPTIONS.map((option) => option.value),
);

const isIssueStatusCategory = (value: unknown): value is IssueStatusCategory =>
  CATEGORY_VALUES.some((category) => category === value);

// The category is required, not defaulted: it decides which column counts as
// done and so the board's progress, and a guessed one would skew both.
export const readNewIssueStatusInput = (body: {
  name?: unknown;
  category?: unknown;
  color?: unknown;
}): NewIssueStatusInput => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (name === '') {
    throw new Error('name is required.');
  }

  if (!isIssueStatusCategory(body.category)) {
    throw new Error(
      `category must be one of ${CATEGORY_VALUES.join(', ')}.`,
    );
  }

  if (body.color !== undefined && !COLOR_VALUES.has(String(body.color))) {
    throw new Error('color is not a status colour.');
  }

  return {
    name,
    category: body.category,
    color:
      body.color === undefined
        ? DEFAULT_ISSUE_STATUS_COLOR_BY_CATEGORY[body.category]
        : String(body.color),
  };
};
