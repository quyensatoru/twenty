import { describe, expect, it } from 'vitest';

import {
  buildCreatedRange,
  readZonedDate,
  readZonedDayStart,
  shiftDate,
} from '../task-date-range.util';

describe('task created date range', () => {
  it('bounds 1–31 Oct inclusively in the reporting timezone', () => {
    expect(
      buildCreatedRange({
        from: '2026-10-01',
        to: '2026-10-31',
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
    ).toEqual({
      gte: '2026-09-30T17:00:00.000Z',
      lt: '2026-10-31T17:00:00.000Z',
    });
  });

  it('leaves an open side open', () => {
    expect(buildCreatedRange({ from: null, to: 'bad', timeZone: 'UTC' })).toEqual({
      gte: null,
      lt: null,
    });
  });

  it('handles daylight-saving zones', () => {
    expect(readZonedDayStart('2026-03-29', 'Europe/Paris')).toBe('2026-03-28T23:00:00.000Z');
    expect(readZonedDayStart('2026-03-30', 'Europe/Paris')).toBe('2026-03-29T22:00:00.000Z');
  });

  it('reads the local day of an instant and shifts days across months', () => {
    expect(readZonedDate(Date.parse('2026-10-31T18:30:00.000Z'), 'Asia/Ho_Chi_Minh')).toBe(
      '2026-11-01',
    );
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
  });
});
