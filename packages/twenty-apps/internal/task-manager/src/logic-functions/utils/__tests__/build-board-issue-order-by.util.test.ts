import { describe, expect, it } from 'vitest';

import { buildBoardIssueOrderBy } from '../build-board-issue-order-by.util';

const PINNED_FIRST = { pinnedAt: 'DescNullsLast' };
const BY_ID = { id: 'AscNullsLast' };

describe('buildBoardIssueOrderBy', () => {
  it('follows the manual order, newest first among equals, when nothing is sorted', () => {
    expect(buildBoardIssueOrderBy([])).toEqual([
      PINNED_FIRST,
      { position: 'AscNullsLast' },
      { createdAt: 'DescNullsLast' },
      BY_ID,
    ]);
  });

  it('orders by each rule in turn, empty values last, then the manual order', () => {
    expect(
      buildBoardIssueOrderBy([
        { field: 'priority', direction: 'desc' },
        { field: 'createdAt', direction: 'asc' },
      ]),
    ).toEqual([
      PINNED_FIRST,
      { priority: 'DescNullsLast' },
      { createdAt: 'AscNullsLast' },
      { position: 'AscNullsLast' },
      BY_ID,
    ]);
  });
});
