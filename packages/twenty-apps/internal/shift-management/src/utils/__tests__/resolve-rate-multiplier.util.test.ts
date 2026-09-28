import { describe, expect, it } from 'vitest';

import { resolveRateMultiplier } from '../resolve-rate-multiplier.util';

describe('resolveRateMultiplier', () => {
  it('returns 1 when no special day matches', () => {
    expect(resolveRateMultiplier([], '2026-08-12')).toBe(1);
  });

  it('matches a yearly special day by month and day', () => {
    expect(
      resolveRateMultiplier(
        [{ kind: 'YEARLY', month: 9, day: 2, date: null, multiplier: 2 }],
        '2026-09-02',
      ),
    ).toBe(2);
  });

  it('matches a specific special day by exact date only', () => {
    const specialDays = [
      {
        kind: 'SPECIFIC',
        month: null,
        day: null,
        date: '2026-02-16',
        multiplier: 3,
      },
    ];

    expect(resolveRateMultiplier(specialDays, '2026-02-17')).toBe(1);
    expect(resolveRateMultiplier(specialDays, '2026-02-16')).toBe(3);
  });

  it('returns the highest multiplier when several match', () => {
    expect(
      resolveRateMultiplier(
        [
          {
            kind: 'SPECIFIC',
            month: null,
            day: null,
            date: '2026-02-16',
            multiplier: 2,
          },
          {
            kind: 'YEARLY',
            month: 2,
            day: 16,
            date: null,
            multiplier: 1.5,
          },
        ],
        '2026-02-16',
      ),
    ).toBe(2);
  });
});
