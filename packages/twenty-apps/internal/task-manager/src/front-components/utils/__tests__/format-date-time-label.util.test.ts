import { describe, expect, it } from 'vitest';

import { formatDateTimeLabel } from '../format-date-time-label.util';

describe('formatDateTimeLabel', () => {
  it('formats a parsable timestamp', () => {
    const label = formatDateTimeLabel('2024-03-05T10:30:00.000Z');

    expect(label).not.toBe('');
    expect(label).toContain('2024');
  });

  it('returns nothing for an unparsable timestamp', () => {
    expect(formatDateTimeLabel('not a date')).toBe('');
  });

  it('returns nothing for a missing or blank timestamp', () => {
    expect(formatDateTimeLabel(null)).toBe('');
    expect(formatDateTimeLabel(undefined)).toBe('');
    expect(formatDateTimeLabel('')).toBe('');
    expect(formatDateTimeLabel('   ')).toBe('');
  });
});
