import { isObject } from '@sniptt/guards';

import {
  BOARD_ISSUE_SORT_DEFAULT_DIRECTIONS,
  BOARD_ISSUE_SORT_FIELDS,
  type BoardIssueSort,
  type BoardIssueSortRule,
  MAX_BOARD_ISSUE_SORT_RULES,
} from '../constants/board-issue-sorts';

const readBoardIssueSortRule = (value: unknown): BoardIssueSortRule | null => {
  if (!isObject(value)) {
    return null;
  }

  const { field, direction } = value as Record<string, unknown>;
  const knownField = BOARD_ISSUE_SORT_FIELDS.find(
    (candidate) => candidate === field,
  );

  if (knownField === undefined) {
    return null;
  }

  return {
    field: knownField,
    direction:
      direction === 'asc' || direction === 'desc'
        ? direction
        : BOARD_ISSUE_SORT_DEFAULT_DIRECTIONS[knownField],
  };
};

// Reads a request's or a saved preference's sort. A single `{ field,
// direction }` is what an earlier version saved, read as a one-rule sort.
export const readBoardIssueSort = (value: unknown): BoardIssueSort => {
  const candidates = Array.isArray(value)
    ? value
    : isObject(value)
      ? [value]
      : [];
  const rules: BoardIssueSort = [];

  for (const candidate of candidates) {
    const rule = readBoardIssueSortRule(candidate);

    if (
      rule !== null &&
      !rules.some((existing) => existing.field === rule.field) &&
      rules.length < MAX_BOARD_ISSUE_SORT_RULES
    ) {
      rules.push(rule);
    }
  }

  return rules;
};
