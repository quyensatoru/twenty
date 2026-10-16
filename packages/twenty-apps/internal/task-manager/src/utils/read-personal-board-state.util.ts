import { isObject, isString } from '@sniptt/guards';

import { TASK_PERSONAL_BOARD_COLUMNS } from '../constants/task-personal-board';
import {
  type PersonalBoardPlan,
  type PersonalBoardPreferences,
} from '../types/task-personal-board';
import { readBoardIssueSort } from './read-board-issue-sort.util';

export const readPersonalBoardPreferences = (
  value: unknown,
): PersonalBoardPreferences => {
  const stored = isObject(value) ? (value as Record<string, unknown>) : {};
  return {
    // My work opens as a list with effects off until the member picks the
    // cards or turns the effects on. The retired Room view ('board') keeps
    // reading as the cards it was replaced by.
    workView:
      stored.workView === 'desk' || stored.workView === 'board'
        ? 'desk'
        : 'list',
    effectsEnabled: stored.effectsEnabled === true,
    density: stored.density === 'compact' ? 'compact' : 'comfortable',
    projectId: isString(stored.projectId) ? stored.projectId : null,
    collapsedColumns: Array.isArray(stored.collapsedColumns)
      ? TASK_PERSONAL_BOARD_COLUMNS.filter((column) =>
          (stored.collapsedColumns as unknown[]).includes(column),
        )
      : [],
    boardSort: readBoardIssueSort(stored.boardSort),
  };
};

export const readPersonalBoardPlan = (value: unknown): PersonalBoardPlan => {
  const stored = isObject(value) ? (value as Record<string, unknown>) : {};
  return {
    column:
      stored.column === 'today' || stored.column === 'next'
        ? stored.column
        : 'inbox',
    rank:
      typeof stored.rank === 'number' && Number.isFinite(stored.rank)
        ? stored.rank
        : 0,
    isPinned: stored.isPinned === true,
  };
};
