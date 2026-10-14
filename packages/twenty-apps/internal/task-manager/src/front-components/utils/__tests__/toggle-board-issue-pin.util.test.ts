import { describe, expect, it } from 'vitest';

import { toggleBoardIssuePin } from '../toggle-board-issue-pin.util';

const NOW = '2026-10-14T07:00:00.000Z';

const issues = [
  { id: 'pinned', statusId: 'todo', pinnedAt: '2026-10-13T07:00:00.000Z' },
  { id: 'first', statusId: 'todo', pinnedAt: null },
  { id: 'other-column', statusId: 'done', pinnedAt: null },
  { id: 'second', statusId: 'todo' },
];

describe('toggleBoardIssuePin', () => {
  it('pins an issue and moves it to the top of the board', () => {
    const result = toggleBoardIssuePin(issues, 'second', NOW);

    expect(result?.pinnedAt).toBe(NOW);
    expect(result?.issues.map((issue) => issue.id)).toEqual([
      'second',
      'pinned',
      'first',
      'other-column',
    ]);
    expect(result?.issues[0]).toEqual({
      id: 'second',
      statusId: 'todo',
      pinnedAt: NOW,
    });
  });

  it('unpins a pinned issue without moving it', () => {
    const result = toggleBoardIssuePin(issues, 'pinned', NOW);

    expect(result?.pinnedAt).toBeNull();
    expect(result?.issues.map((issue) => issue.id)).toEqual([
      'pinned',
      'first',
      'other-column',
      'second',
    ]);
    expect(result?.issues[0]?.pinnedAt).toBeNull();
  });

  it('returns null for an issue that is not on the board', () => {
    expect(toggleBoardIssuePin(issues, 'missing', NOW)).toBeNull();
  });
});
