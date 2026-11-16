import { describe, expect, it } from 'vitest';

import {
  buildTrendBuckets,
  isInPeriod,
  localMidnightToUtc,
  resolveReportingPeriod,
} from '../analytics-period.util';

describe('resolveReportingPeriod', () => {
  it('bounds an inclusive custom range by local midnights of the timezone', () => {
    const period = resolveReportingPeriod({
      input: { from: '2026-10-01', to: '2026-10-31' },
      timezone: 'Asia/Ho_Chi_Minh',
      now: '2026-11-12T03:00:00.000Z',
    });

    expect(period.start).toBe('2026-09-30T17:00:00.000Z');
    expect(period.end).toBe('2026-10-31T17:00:00.000Z');
    expect(period.dayCount).toBe(31);
    expect(isInPeriod('2026-10-31T16:59:59.000Z', period)).toBe(true);
    expect(isInPeriod('2026-10-31T17:00:00.000Z', period)).toBe(false);
  });

  it('counts a preset back from today in the reporting timezone', () => {
    const period = resolveReportingPeriod({
      input: { preset: '7' },
      timezone: 'Asia/Ho_Chi_Minh',
      now: '2026-11-11T20:00:00.000Z',
    });

    expect(period.toDate).toBe('2026-11-12');
    expect(period.fromDate).toBe('2026-11-06');
  });

  it('rejects a From date after the To date', () => {
    expect(() =>
      resolveReportingPeriod({
        input: { from: '2026-10-31', to: '2026-10-01' },
        timezone: 'UTC',
        now: '2026-11-12T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('handles daylight saving changes', () => {
    expect(localMidnightToUtc('2026-03-08', 'America/New_York')).toBe(
      '2026-03-08T05:00:00.000Z',
    );
    expect(localMidnightToUtc('2026-03-09', 'America/New_York')).toBe(
      '2026-03-09T04:00:00.000Z',
    );
  });
});

describe('buildTrendBuckets', () => {
  it('uses weeks up to 90 days and months beyond', () => {
    const weekly = resolveReportingPeriod({
      input: { from: '2026-10-01', to: '2026-10-31' },
      timezone: 'UTC',
      now: '2026-11-12T00:00:00.000Z',
    });
    const monthly = resolveReportingPeriod({
      input: { from: '2026-01-15', to: '2026-10-31' },
      timezone: 'UTC',
      now: '2026-11-12T00:00:00.000Z',
    });

    expect(buildTrendBuckets(weekly)).toHaveLength(5);
    expect(buildTrendBuckets(monthly).map((bucket) => bucket.label)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
  });
});
