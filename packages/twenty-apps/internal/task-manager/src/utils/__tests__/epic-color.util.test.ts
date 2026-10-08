import { describe, expect, it } from 'vitest';

import { pickNextEpicColor, readEpicColor } from '../epic-color.util';
import { stringToThemeColorName } from '../string-to-theme-color.util';

describe('pickNextEpicColor', () => {
  it('starts with the first colour', () => {
    expect(pickNextEpicColor([])).toBe('PURPLE');
  });

  it('takes the first colour not used yet', () => {
    expect(pickNextEpicColor(['PURPLE', 'BLUE'])).toBe('GREEN');
  });

  it('reads stored colours case-insensitively', () => {
    expect(pickNextEpicColor(['purple'])).toBe('BLUE');
  });

  it('takes the least used colour once every one is taken', () => {
    expect(
      pickNextEpicColor([
        'PURPLE',
        'PURPLE',
        'BLUE',
        'GREEN',
        'ORANGE',
        'PINK',
        'TURQUOISE',
        'YELLOW',
        'RED',
      ]),
    ).toBe('BLUE');
  });

  it('ignores colours outside the epic palette', () => {
    expect(pickNextEpicColor(['TEAL', null])).toBe('PURPLE');
  });
});

describe('readEpicColor', () => {
  it('renders the stored colour as a theme key', () => {
    expect(readEpicColor({ id: 'epic-1', color: 'GREEN' })).toBe('green');
  });

  it('falls back to a colour derived from the id', () => {
    expect(readEpicColor({ id: 'epic-1', color: null })).toBe(
      stringToThemeColorName('epic-1'),
    );
  });
});
