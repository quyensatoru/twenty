import { describe, expect, it } from 'vitest';

import { formatSprintDateRange } from '../format-sprint-date-range.util';

describe('formatSprintDateRange', () => {
  it('prints both ends', () => {
    expect(
      formatSprintDateRange({
        startDate: '2026-10-08T00:00:00.000Z',
        endDate: '2026-10-22T00:00:00.000Z',
        locale: 'en-US',
        timeZone: 'UTC',
      }),
    ).toBe('Oct 8 – Oct 22');
  });

  it('marks a missing end', () => {
    expect(
      formatSprintDateRange({
        startDate: '2026-10-08T00:00:00.000Z',
        endDate: null,
        locale: 'en-US',
        timeZone: 'UTC',
      }),
    ).toBe('Oct 8 – ?');
  });

  it('is null for a sprint with no dates', () => {
    expect(formatSprintDateRange({ startDate: null, endDate: undefined })).toBeNull();
  });
});
