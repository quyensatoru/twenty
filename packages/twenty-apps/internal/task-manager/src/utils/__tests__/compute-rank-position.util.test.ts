import { describe, expect, it } from 'vitest';

import { computeRankPosition } from '../compute-rank-position.util';

describe('computeRankPosition', () => {
  it('splits the gap to the next issue when dropped after the anchor', () => {
    expect(
      computeRankPosition({ anchorPosition: 2, neighborPosition: 3, side: 'after' }),
    ).toBe(2.5);
  });

  it('steps past the anchor at the end of a section', () => {
    expect(
      computeRankPosition({ anchorPosition: 2, neighborPosition: null, side: 'after' }),
    ).toBe(3);
  });

  it('splits the gap to the previous issue when dropped before the anchor', () => {
    expect(
      computeRankPosition({ anchorPosition: 2, neighborPosition: 1, side: 'before' }),
    ).toBe(1.5);
  });

  it('steps before the anchor at the top of a section', () => {
    expect(
      computeRankPosition({ anchorPosition: -4, neighborPosition: null, side: 'before' }),
    ).toBe(-5);
  });
});
