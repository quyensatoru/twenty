import { describe, expect, it } from 'vitest';

import { buildBoardIssueOrderBy } from '../build-board-issue-order-by.util';

const PINNED_FIRST = { pinnedAt: 'DescNullsLast' };
const TIE_BREAKERS = [{ position: 'AscNullsLast' }, { id: 'AscNullsLast' }];

describe('buildBoardIssueOrderBy', () => {
  it('puts the newest issues first when nothing is sorted', () => {
    expect(buildBoardIssueOrderBy([])).toEqual([
      PINNED_FIRST,
      { createdAt: 'DescNullsLast' },
      ...TIE_BREAKERS,
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
      ...TIE_BREAKERS,
    ]);
  });
});
