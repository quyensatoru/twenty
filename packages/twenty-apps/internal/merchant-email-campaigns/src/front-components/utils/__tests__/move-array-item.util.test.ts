import { describe, expect, it } from 'vitest';

import { moveArrayItem } from '../move-array-item.util';

describe('moveArrayItem', () => {
  it('moves an item', () => {
    expect(moveArrayItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('ignores out-of-range moves', () => {
    const items = ['a', 'b'];

    expect(moveArrayItem(items, 1, 2)).toBe(items);
  });
});
