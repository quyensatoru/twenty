import { describe, expect, it } from 'vitest';

import {
  addWeeksToDateInput,
  dateInputToIso,
  toDateInputValue,
} from '../sprint-dates.util';

describe('addWeeksToDateInput', () => {
  it('adds whole weeks across a month end', () => {
    expect(addWeeksToDateInput('2026-10-22', 2)).toBe('2026-11-05');
  });

  it('leaves a malformed value alone', () => {
    expect(addWeeksToDateInput('', 2)).toBe('');
  });
});

describe('dateInputToIso', () => {
  it('round-trips through the date input in any time zone', () => {
    const start = dateInputToIso('2026-10-08', 'start');
    const end = dateInputToIso('2026-10-08', 'end');

    expect(toDateInputValue(start)).toBe('2026-10-08');
    expect(toDateInputValue(end)).toBe('2026-10-08');
    expect(Date.parse(end ?? '')).toBeGreaterThan(Date.parse(start ?? ''));
  });

  it('refuses a malformed value', () => {
    expect(dateInputToIso('08/10/2026', 'start')).toBeNull();
  });
});

describe('toDateInputValue', () => {
  it('is empty for nothing or an invalid date', () => {
    expect(toDateInputValue(null)).toBe('');
    expect(toDateInputValue('soon')).toBe('');
  });
});
