import { describe, expect, it } from 'vitest';

import { computeDropPosition } from '../../front-components/utils/compute-drop-position.util';
import { groupIssuesBy, UNGROUPED_GROUP_KEY } from '../../front-components/utils/group-issues-by.util';
import { computeEpicProgress } from '../compute-epic-progress.util';

describe('computeDropPosition', () => {
  it('places a record before the first one', () => {
    expect(computeDropPosition({ positions: [1, 2, 3], targetIndex: 0 })).toBe(
      0,
    );
  });

  it('places a record after the last one', () => {
    expect(computeDropPosition({ positions: [1, 2, 3], targetIndex: 3 })).toBe(
      4,
    );
  });

  // Fractional, so a move rewrites only the record being moved.
  it('places a record between its new neighbours', () => {
    expect(computeDropPosition({ positions: [1, 2], targetIndex: 1 })).toBe(1.5);
  });

  it('starts a list at one', () => {
    expect(computeDropPosition({ positions: [], targetIndex: 0 })).toBe(1);
  });
});

describe('groupIssuesBy', () => {
  it('keeps declared groups present even when empty', () => {
    const grouped = groupIssuesBy({
      issues: [{ id: 'issue-1', sprintId: 'sprint-1', position: 2 }],
      groupKey: 'sprintId',
      groupIds: ['sprint-1', 'sprint-2'],
    });

    expect(grouped.get('sprint-1')?.map((issue) => issue.id)).toEqual([
      'issue-1',
    ]);
    expect(grouped.get('sprint-2')).toEqual([]);
  });

  it('collects records with no group under the ungrouped key, ordered by position', () => {
    const grouped = groupIssuesBy({
      issues: [
        { id: 'issue-2', position: 2 },
        { id: 'issue-1', position: 1 },
      ],
      groupKey: 'sprintId',
      groupIds: [],
    });

    expect(grouped.get(UNGROUPED_GROUP_KEY)?.map((issue) => issue.id)).toEqual([
      'issue-1',
      'issue-2',
    ]);
  });
});

describe('computeEpicProgress', () => {
  it('counts issues whose status is in the DONE category', () => {
    expect(
      computeEpicProgress({
        issues: [{ statusId: 'done' }, { statusId: 'todo' }],
        doneStatusIds: ['done'],
      }),
    ).toEqual({ doneCount: 1, totalCount: 2, percentage: 50 });
  });

  it('reports zero for an empty epic rather than dividing by zero', () => {
    expect(
      computeEpicProgress({ issues: [], doneStatusIds: ['done'] }),
    ).toEqual({ doneCount: 0, totalCount: 0, percentage: 0 });
  });
});
