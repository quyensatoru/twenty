import { describe, expect, it } from 'vitest';

import { summarizeBoardProgress } from '../summarize-board-progress.util';

const page = (totalCount: number) => ({
  totalCount,
  endCursor: null,
  hasNextPage: false,
});

describe('summarizeBoardProgress', () => {
  it('sums every column and the done ones', () => {
    expect(
      summarizeBoardProgress({
        columnPages: { todo: page(3), doing: page(2), done: page(5), NO_STATUS: page(0) },
        columnKeys: ['todo', 'doing', 'done', 'NO_STATUS'],
        doneStatusIds: new Set(['done']),
        startedStatusIds: new Set(['doing']),
      }),
    ).toEqual({ totalCount: 10, doneCount: 5, startedCount: 2, percent: 50 });
  });

  it('reads an empty board as 0%', () => {
    expect(
      summarizeBoardProgress({
        columnPages: {},
        columnKeys: ['todo'],
        doneStatusIds: new Set(),
      }),
    ).toEqual({ totalCount: 0, doneCount: 0, startedCount: 0, percent: 0 });
  });
});
