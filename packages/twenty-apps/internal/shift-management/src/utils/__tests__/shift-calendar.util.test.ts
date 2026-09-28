import { describe, expect, it } from 'vitest';

import {
  formatMonthLabel,
  getIctWeekRange,
  getMonthRange,
  getRecentMonthValues,
} from '../shift-calendar.util';
import { getTodayIct } from '../shift-time.util';

const utcWeekday = (isoDate: string): string =>
  // Anchor the pure date at UTC noon so no timezone can roll it to an adjacent day.
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(`${isoDate}T12:00:00Z`));

describe('getIctWeekRange', () => {
  it('places a Wednesday-evening UTC instant that is already Thursday ICT in the correct week', () => {
    // 18:00 UTC Wed 2026-08-12 is 01:00 ICT Thu 2026-08-13.
    const reference = new Date('2026-08-12T18:00:00Z');

    const { days, fromDate, toDate } = getIctWeekRange(reference);

    expect(getTodayIct(reference)).toBe('2026-08-13');
    expect(days).toContain('2026-08-13');
    expect(fromDate).toBe('2026-08-10');
    expect(toDate).toBe('2026-08-16');
  });

  it('starts the week on Monday and ends on Sunday (ICT)', () => {
    const { days } = getIctWeekRange(new Date('2026-08-12T18:00:00Z'));

    expect(utcWeekday(days[0])).toBe('Mon');
    expect(utcWeekday(days[6])).toBe('Sun');
  });

  it('returns 7 consecutive day entries Monday to Sunday', () => {
    const { days } = getIctWeekRange(new Date('2026-08-12T18:00:00Z'));

    expect(days).toHaveLength(7);
    expect(days).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
  });

  it('rolls into the next week when a Sunday-evening UTC instant is already Monday ICT', () => {
    // 18:00 UTC Sun 2026-08-16 is 01:00 ICT Mon 2026-08-17 — a boundary a
    // UTC-based computation would get wrong.
    const reference = new Date('2026-08-16T18:00:00Z');

    const { days, fromDate, toDate } = getIctWeekRange(reference);

    expect(getTodayIct(reference)).toBe('2026-08-17');
    expect(fromDate).toBe('2026-08-17');
    expect(toDate).toBe('2026-08-23');
    expect(days[0]).toBe('2026-08-17');
  });

  it('keeps fromDate lexicographically before or equal to toDate', () => {
    const { fromDate, toDate } = getIctWeekRange(
      new Date('2026-08-12T18:00:00Z'),
    );

    expect(fromDate <= toDate).toBe(true);
  });
});

describe('getRecentMonthValues', () => {
  it('lists the current ICT month first, then previous months', () => {
    expect(getRecentMonthValues(3, new Date('2026-08-14T12:00:00Z'))).toEqual([
      '2026-08',
      '2026-07',
      '2026-06',
    ]);
  });

  it('rolls the year boundary correctly', () => {
    expect(getRecentMonthValues(3, new Date('2026-01-14T12:00:00Z'))).toEqual([
      '2026-01',
      '2025-12',
      '2025-11',
    ]);
  });
});

describe('getMonthRange', () => {
  it('spans the first to last day of a 31-day month', () => {
    expect(getMonthRange('2026-08')).toEqual({
      fromDate: '2026-08-01',
      toDate: '2026-08-31',
    });
  });

  it('resolves February in a leap year to 29 days', () => {
    expect(getMonthRange('2028-02')).toEqual({
      fromDate: '2028-02-01',
      toDate: '2028-02-29',
    });
  });
});

describe('formatMonthLabel', () => {
  it('formats a YYYY-MM value as a month-and-year label', () => {
    expect(formatMonthLabel('2026-08')).toBe('August 2026');
  });
});
