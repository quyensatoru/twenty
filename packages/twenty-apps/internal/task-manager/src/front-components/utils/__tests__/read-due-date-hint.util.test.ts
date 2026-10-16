import { describe, expect, it } from 'vitest';

import { readDueDateHint } from '../read-due-date-hint.util';

const NOW = new Date(2026, 9, 16, 22, 30);

describe('readDueDateHint', () => {
  it('counts calendar days until an upcoming date', () => {
    expect(
      readDueDateHint(new Date(2026, 9, 18, 9, 0).toISOString(), NOW),
    ).toEqual({ direction: 'upcoming', days: 2 });
  });

  it('counts calendar days past an overdue date', () => {
    expect(
      readDueDateHint(new Date(2026, 9, 13, 23, 0).toISOString(), NOW),
    ).toEqual({ direction: 'overdue', days: 3 });
  });

  it('leaves today, tomorrow and yesterday to the due label', () => {
    for (const day of [15, 16, 17]) {
      expect(
        readDueDateHint(new Date(2026, 9, day, 8, 0).toISOString(), NOW),
      ).toBeNull();
    }
  });

  it('ignores a missing or unreadable date', () => {
    expect(readDueDateHint(null, NOW)).toBeNull();
    expect(readDueDateHint('', NOW)).toBeNull();
    expect(readDueDateHint('not a date', NOW)).toBeNull();
  });
});
