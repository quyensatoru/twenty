import { describe, expect, it } from 'vitest';

import {
  clampColumnWidth,
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MAX_WIDTH,
  COLUMN_MIN_WIDTH,
  parseColumnWidths,
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

describe('parseColumnWidths', () => {
  it('reads a stored map and clamps every width', () => {
    expect(parseColumnWidths('{"a":320,"b":9999}')).toEqual({
      a: 320,
      b: COLUMN_MAX_WIDTH,
    });
  });

  it('drops entries that are not numbers', () => {
    expect(parseColumnWidths('{"a":"wide","b":250}')).toEqual({ b: 250 });
  });

  it('returns an empty map for nothing stored or broken JSON', () => {
    expect(parseColumnWidths(null)).toEqual({});
    expect(parseColumnWidths('not json')).toEqual({});
    expect(parseColumnWidths('[1,2]')).toEqual({});
  });
});
