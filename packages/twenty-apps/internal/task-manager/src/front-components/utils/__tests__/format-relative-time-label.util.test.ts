import { describe, expect, it } from 'vitest';

import { formatRelativeTimeLabel } from '../format-relative-time-label.util';

const NOW = new Date('2026-03-05T12:00:00.000Z');

describe('formatRelativeTimeLabel', () => {
  it('counts in days inside the month', () => {
    const label = formatRelativeTimeLabel('2026-03-02T12:00:00.000Z', NOW);

    expect(label).toContain('3');
    expect(label).toContain('day');
  });

  it('counts in hours inside the day', () => {
    const label = formatRelativeTimeLabel('2026-03-05T09:00:00.000Z', NOW);

    expect(label).toContain('3');
    expect(label).toContain('hour');
  });

  it('counts in minutes inside the hour', () => {
    const label = formatRelativeTimeLabel('2026-03-05T11:45:00.000Z', NOW);

    expect(label).toContain('15');
    expect(label).toContain('minute');
  });

  it('falls back to a date past a month', () => {
    const label = formatRelativeTimeLabel('2025-11-02T12:00:00.000Z', NOW);

    expect(label).toContain('2025');
  });

  it('reads as now for a timestamp a clock skew puts in the future', () => {
    const label = formatRelativeTimeLabel('2026-03-05T12:00:03.000Z', NOW);

    expect(label).not.toContain('in ');
  });

  it('returns nothing for a missing or unparsable timestamp', () => {
    expect(formatRelativeTimeLabel(null, NOW)).toBe('');
    expect(formatRelativeTimeLabel(undefined, NOW)).toBe('');
    expect(formatRelativeTimeLabel('   ', NOW)).toBe('');
    expect(formatRelativeTimeLabel('not a date', NOW)).toBe('');
  });
});
