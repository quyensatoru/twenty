import { describe, expect, it } from 'vitest';

import {
  clampColumnWidth,
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MAX_WIDTH,
  COLUMN_MIN_WIDTH,
  parseColumnWidth,
} from '../column-widths.util';

describe('clampColumnWidth', () => {
  it('keeps a width inside the bounds and rounds it', () => {
    expect(clampColumnWidth(300.6)).toBe(301);
  });

  it('clamps to the bounds', () => {
    expect(clampColumnWidth(10)).toBe(COLUMN_MIN_WIDTH);
    expect(clampColumnWidth(5000)).toBe(COLUMN_MAX_WIDTH);
  });

  it('falls back to the default for a non-number', () => {
    expect(clampColumnWidth(Number.NaN)).toBe(COLUMN_DEFAULT_WIDTH);
  });
});

describe('parseColumnWidth', () => {
  it('reads a stored width and clamps it', () => {
    expect(parseColumnWidth('320')).toBe(320);
    expect(parseColumnWidth('9999')).toBe(COLUMN_MAX_WIDTH);
  });

  it('falls back to the default for nothing stored or garbage', () => {
    expect(parseColumnWidth(null)).toBe(COLUMN_DEFAULT_WIDTH);
    expect(parseColumnWidth('wide')).toBe(COLUMN_DEFAULT_WIDTH);
    expect(parseColumnWidth('')).toBe(COLUMN_DEFAULT_WIDTH);
  });
});
