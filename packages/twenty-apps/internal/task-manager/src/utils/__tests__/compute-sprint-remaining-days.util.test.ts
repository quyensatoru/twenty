import { describe, expect, it } from 'vitest';

import { computeSprintRemainingDays } from '../compute-sprint-remaining-days.util';

// Local dates: the count is in the reader's calendar days.
const NOW = new Date(2026, 9, 8, 16, 0);

describe('computeSprintRemainingDays', () => {
  it('has nothing to say without a valid end date', () => {
    expect(computeSprintRemainingDays({ endDate: null, now: NOW })).toBeNull();
    expect(computeSprintRemainingDays({ endDate: 'soon', now: NOW })).toBeNull();
  });

  it('counts calendar days to the end date', () => {
    expect(
      computeSprintRemainingDays({
        endDate: new Date(2026, 9, 15, 23, 59).toISOString(),
        now: NOW,
      }),
    ).toEqual({ remainingDays: 7, isOverdue: false });
  });

  it('has no day left on the last day', () => {
    expect(
      computeSprintRemainingDays({
        endDate: new Date(2026, 9, 8, 23, 59).toISOString(),
        now: NOW,
      }),
    ).toEqual({ remainingDays: 0, isOverdue: false });
  });

  it('flags a sprint past its end', () => {
    expect(
      computeSprintRemainingDays({
        endDate: new Date(2026, 9, 7, 23, 59).toISOString(),
        now: NOW,
      }),
    ).toEqual({ remainingDays: 0, isOverdue: true });
  });
});
