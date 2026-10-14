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
    workView: stored.workView === 'list' ? 'list' : 'desk',
    effectsEnabled: stored.effectsEnabled !== false,
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
