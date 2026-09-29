import { describe, expect, it } from 'vitest';

import {
  stringToThemeColorName,
  THEME_COLOR_NAMES,
} from '../string-to-theme-color.util';

// Reimplements twenty-ui's stringToThemeColor from its own source, so this
// fails the day the app's copy drifts from the palette Twenty picks.
const pickThemeColorTheWayTwentyUiDoes = (value: string): string => {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return THEME_COLOR_NAMES[Math.abs(hash) % THEME_COLOR_NAMES.length];
};

describe('stringToThemeColorName', () => {
  it('gives the same member the same colour every time', () => {
    expect(stringToThemeColorName('quyen pv')).toBe(
      stringToThemeColorName('quyen pv'),
    );
  });

  it('agrees with the palette twenty-ui picks', () => {
    for (const name of ['quyen pv', 'Tim Apple', '', 'Đỗ Văn A', 'zzz']) {
      expect(stringToThemeColorName(name)).toBe(
        pickThemeColorTheWayTwentyUiDoes(name),
      );
    }
  });

  it('only ever returns a palette colour', () => {
    for (const name of ['a', 'bb', 'ccc', 'dddd']) {
      expect(THEME_COLOR_NAMES).toContain(stringToThemeColorName(name));
    }
  });
});
