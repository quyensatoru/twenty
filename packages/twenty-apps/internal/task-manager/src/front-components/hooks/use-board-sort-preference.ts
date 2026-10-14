import { useState } from 'react';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  BOARD_ISSUE_SORT_DEFAULT_DIRECTIONS,
  BOARD_ISSUE_SORT_FIELDS,
  type BoardIssueSort,
  type BoardIssueSortField,
  MAX_BOARD_ISSUE_SORT_RULES,
} from '../../constants/board-issue-sorts';
import { TASK_PERSONAL_BOARD_ROUTE_PATH } from '../../constants/task-personal-board';
import { readBoardIssueSort } from '../../utils/read-board-issue-sort.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

// Until the viewer changes the order the board asks for none, and the server
// answers with the one this viewer saved: requesting it here first would load
// the board once in the default order and again in the saved one.
export const useBoardSortPreference = (savedSort: unknown) => {
  const [requestedSort, setRequestedSort] = useState<BoardIssueSort | null>(
    null,
  );
  const sort = requestedSort ?? readBoardIssueSort(savedSort);
  const unusedFields = BOARD_ISSUE_SORT_FIELDS.filter(
    (field) => !sort.some((rule) => rule.field === field),
  );

  const applySort = async (nextSort: BoardIssueSort) => {
    setRequestedSort(nextSort);

    try {
      await postAppRoute(TASK_PERSONAL_BOARD_ROUTE_PATH, {
        action: 'preferences',
        patch: { boardSort: nextSort },
      });
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const canAddRule =
    sort.length < MAX_BOARD_ISSUE_SORT_RULES && unusedFields.length > 0;

  const addRule = async () => {
    const field = unusedFields[0];

    if (!canAddRule || field === undefined) {
      return;
    }

    await applySort([
      ...sort,
      { field, direction: BOARD_ISSUE_SORT_DEFAULT_DIRECTIONS[field] },
    ]);
  };

  // A field opens in its own natural direction rather than inheriting the
  // rule's last one: "due date, descending" puts the furthest deadline first.
  const changeRuleField = async (index: number, field: BoardIssueSortField) => {
    if (
      sort.some(
        (rule, ruleIndex) => ruleIndex !== index && rule.field === field,
      )
    ) {
      return;
    }

    await applySort(
      sort.map((rule, ruleIndex) =>
        ruleIndex === index
          ? { field, direction: BOARD_ISSUE_SORT_DEFAULT_DIRECTIONS[field] }
          : rule,
      ),
    );
  };

  const toggleRuleDirection = (index: number) =>
    applySort(
      sort.map((rule, ruleIndex) =>
        ruleIndex === index
          ? { ...rule, direction: rule.direction === 'asc' ? 'desc' : 'asc' }
          : rule,
      ),
    );

  const moveRuleUp = async (index: number) => {
    if (index <= 0 || index >= sort.length) {
      return;
    }

    const nextSort = [...sort];

    [nextSort[index - 1], nextSort[index]] = [
      nextSort[index],
      nextSort[index - 1],
    ];
    await applySort(nextSort);
  };

  const removeRule = (index: number) =>
    applySort(sort.filter((_, ruleIndex) => ruleIndex !== index));

  const clearSort = () => applySort([]);

  return {
    requestedSort,
    sort,
    canAddRule,
    addRule,
    changeRuleField,
    toggleRuleDirection,
    moveRuleUp,
    removeRule,
    clearSort,
  };
};
