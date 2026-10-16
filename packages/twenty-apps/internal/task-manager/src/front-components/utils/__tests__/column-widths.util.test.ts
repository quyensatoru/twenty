import { describe, expect, it } from 'vitest';

import {
  clampColumnWidth,
  COLLAPSED_COLUMN_WIDTH,
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MAX_WIDTH,
  COLUMN_MIN_WIDTH,
  parseColumnWidth,
  parseIsColumnCollapsed,
  readBoardColumnLayout,
  readBoardColumnWidth,
  readResizedColumnWidth,
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

describe('readBoardColumnLayout', () => {
  it('keeps every column at the shared width unless collapsed', () => {
    expect(readBoardColumnLayout({ isCollapsed: false })).toBe('normal');
    expect(readBoardColumnLayout({ isCollapsed: true })).toBe('collapsed');
  });
});

describe('readBoardColumnWidth', () => {
  it('maps each layout to its width', () => {
    expect(readBoardColumnWidth('normal', 300)).toBe(300);
    expect(readBoardColumnWidth('collapsed', 300)).toBe(COLLAPSED_COLUMN_WIDTH);
  });
});

describe('readResizedColumnWidth', () => {
  it('spreads the drag over the resizable columns up to the held one', () => {
    expect(
      readResizedColumnWidth({
        startWidth: 272,
        deltaX: 60,
        resizableColumnCountThroughHeld: 3,
      }),
    ).toBe(292);
  });

  it('clamps the result and never divides by zero', () => {
    expect(
      readResizedColumnWidth({
        startWidth: 272,
        deltaX: -500,
        resizableColumnCountThroughHeld: 0,
      }),
    ).toBe(COLUMN_MIN_WIDTH);
  });
});

describe('parseIsColumnCollapsed', () => {
  it('reads only an explicit true as collapsed', () => {
    expect(parseIsColumnCollapsed('true')).toBe(true);
    expect(parseIsColumnCollapsed('false')).toBe(false);
    expect(parseIsColumnCollapsed(null)).toBe(false);
    expect(parseIsColumnCollapsed('yes')).toBe(false);
  });
});
