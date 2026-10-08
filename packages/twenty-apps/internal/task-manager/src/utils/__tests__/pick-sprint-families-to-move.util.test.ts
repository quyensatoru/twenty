import { describe, expect, it } from 'vitest';

import { pickSprintFamiliesToMove } from '../pick-sprint-families-to-move.util';

const DONE_STATUS_IDS = ['done'];

describe('pickSprintFamiliesToMove', () => {
  it('moves unfinished top-level issues and keeps done ones', () => {
    expect(
      pickSprintFamiliesToMove({
        issues: [
          { id: 'a', statusId: 'todo' },
          { id: 'b', statusId: 'done' },
          { id: 'c', statusId: null },
        ],
        doneStatusIds: DONE_STATUS_IDS,
      }),
    ).toEqual(['a', 'c']);
  });

  it('moves an unfinished parent with all its subtasks, done ones included', () => {
    expect(
      pickSprintFamiliesToMove({
        issues: [
          { id: 'parent', statusId: 'todo' },
          { id: 'child-1', statusId: 'done', parentId: 'parent' },
          { id: 'child-2', statusId: 'todo', parentId: 'parent' },
        ],
        doneStatusIds: DONE_STATUS_IDS,
      }),
    ).toEqual(['parent', 'child-1', 'child-2']);
  });

  it('keeps a done parent and its unfinished subtasks in the sprint', () => {
    expect(
      pickSprintFamiliesToMove({
        issues: [
          { id: 'parent', statusId: 'done' },
          { id: 'child', statusId: 'todo', parentId: 'parent' },
        ],
        doneStatusIds: DONE_STATUS_IDS,
      }),
    ).toEqual([]);
  });

  it('judges a subtask whose parent is outside the sprint on its own status', () => {
    expect(
      pickSprintFamiliesToMove({
        issues: [
          { id: 'open', statusId: 'todo', parentId: 'elsewhere' },
          { id: 'closed', statusId: 'done', parentId: 'elsewhere' },
        ],
        doneStatusIds: DONE_STATUS_IDS,
      }),
    ).toEqual(['open']);
  });

  it('follows nested subtasks up to their top-level issue', () => {
    expect(
      pickSprintFamiliesToMove({
        issues: [
          { id: 'parent', statusId: 'todo' },
          { id: 'child', statusId: 'done', parentId: 'parent' },
          { id: 'grandchild', statusId: 'todo', parentId: 'child' },
        ],
        doneStatusIds: DONE_STATUS_IDS,
      }),
    ).toEqual(['parent', 'child', 'grandchild']);
  });

  it('stops on a parent cycle instead of looping', () => {
    expect(
      pickSprintFamiliesToMove({
        issues: [
          { id: 'x', statusId: 'todo', parentId: 'y' },
          { id: 'y', statusId: 'todo', parentId: 'x' },
        ],
        doneStatusIds: DONE_STATUS_IDS,
      }),
    ).toEqual(['x', 'y']);
  });
});
