import { describe, expect, it } from 'vitest';

import {
  clampSideColumnWidth,
  parseSideColumnWidth,
  SIDE_COLUMN_MAX_WIDTH,
  SIDE_COLUMN_MIN_WIDTH,
} from '../side-column-width.util';

describe('clampSideColumnWidth', () => {
  it('keeps a width inside the bounds and rounds it', () => {
    expect(clampSideColumnWidth(420.4)).toBe(420);
  });

  it('clamps to the bounds', () => {
    expect(clampSideColumnWidth(100)).toBe(SIDE_COLUMN_MIN_WIDTH);
    expect(clampSideColumnWidth(5000)).toBe(SIDE_COLUMN_MAX_WIDTH);
  });
});

describe('parseSideColumnWidth', () => {
  it('reads a stored width and clamps it', () => {
    expect(parseSideColumnWidth('500')).toBe(500);
    expect(parseSideColumnWidth('9999')).toBe(SIDE_COLUMN_MAX_WIDTH);
  });

  it('keeps the responsive default when nothing usable is stored', () => {
    expect(parseSideColumnWidth(null)).toBeNull();
    expect(parseSideColumnWidth('  ')).toBeNull();
    expect(parseSideColumnWidth('wide')).toBeNull();
  });
});
