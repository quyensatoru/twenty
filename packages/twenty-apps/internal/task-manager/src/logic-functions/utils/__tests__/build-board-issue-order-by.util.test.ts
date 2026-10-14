import { describe, expect, it } from 'vitest';

import { buildBoardIssueOrderBy } from '../build-board-issue-order-by.util';

const TIE_BREAKERS = [{ position: 'AscNullsLast' }, { id: 'AscNullsLast' }];

describe('buildBoardIssueOrderBy', () => {
  it('keeps the manual order when nothing is sorted', () => {
    expect(buildBoardIssueOrderBy([])).toEqual(TIE_BREAKERS);
  });

  it('orders by each rule in turn, empty values last, then the manual order', () => {
    expect(
      buildBoardIssueOrderBy([
        { field: 'priority', direction: 'desc' },
        { field: 'createdAt', direction: 'asc' },
      ]),
    ).toEqual([
      { priority: 'DescNullsLast' },
      { createdAt: 'AscNullsLast' },
      ...TIE_BREAKERS,
    ]);
  });
});
