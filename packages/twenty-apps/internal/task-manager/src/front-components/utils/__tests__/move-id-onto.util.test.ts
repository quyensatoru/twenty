import { describe, expect, it } from 'vitest';

import { moveIdOnto } from '../move-id-onto.util';

describe('moveIdOnto', () => {
  it('lands after the target when moved to the right', () => {
    expect(moveIdOnto(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
  });

  it('lands before the target when moved to the left', () => {
    expect(moveIdOnto(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual([
      'a',
      'd',
      'b',
      'c',
    ]);
  });

  it('swaps neighbours', () => {
    expect(moveIdOnto(['a', 'b', 'c'], 'a', 'b')).toEqual(['b', 'a', 'c']);
    expect(moveIdOnto(['a', 'b', 'c'], 'c', 'b')).toEqual(['a', 'c', 'b']);
  });

  it('returns the same order when dropped on itself', () => {
    const ids = ['a', 'b', 'c'];

    expect(moveIdOnto(ids, 'b', 'b')).toBe(ids);
  });

  it('returns the same order when either id is unknown', () => {
    const ids = ['a', 'b', 'c'];

    expect(moveIdOnto(ids, 'x', 'b')).toBe(ids);
    expect(moveIdOnto(ids, 'a', 'x')).toBe(ids);
  });
});
