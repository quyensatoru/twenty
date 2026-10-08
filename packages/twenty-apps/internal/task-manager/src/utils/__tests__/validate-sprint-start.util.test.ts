import { describe, expect, it } from 'vitest';

import { validateSprintStart } from '../validate-sprint-start.util';

const VALID_START = {
  state: 'FUTURE',
  issueCount: 3,
  otherActiveSprintCount: 0,
  startDate: '2026-10-08T00:00:00.000Z',
  endDate: '2026-10-22T00:00:00.000Z',
};

describe('validateSprintStart', () => {
  it('accepts a future sprint with issues and ordered dates', () => {
    expect(validateSprintStart(VALID_START)).toBeNull();
  });

  it('treats a sprint with no state as future', () => {
    expect(validateSprintStart({ ...VALID_START, state: null })).toBeNull();
  });

  it('refuses a sprint that already started or closed', () => {
    expect(validateSprintStart({ ...VALID_START, state: 'ACTIVE' })).toBe(
      'NOT_FUTURE',
    );
    expect(validateSprintStart({ ...VALID_START, state: 'CLOSED' })).toBe(
      'NOT_FUTURE',
    );
  });

  it('refuses while another sprint is active', () => {
    expect(
      validateSprintStart({ ...VALID_START, otherActiveSprintCount: 1 }),
    ).toBe('ANOTHER_ACTIVE');
  });

  it('refuses an empty sprint', () => {
    expect(validateSprintStart({ ...VALID_START, issueCount: 0 })).toBe(
      'NO_ISSUES',
    );
  });

  it('requires both dates', () => {
    expect(validateSprintStart({ ...VALID_START, startDate: undefined })).toBe(
      'MISSING_DATES',
    );
    expect(validateSprintStart({ ...VALID_START, endDate: 'not a date' })).toBe(
      'MISSING_DATES',
    );
  });

  it('requires the end after the start', () => {
    expect(
      validateSprintStart({ ...VALID_START, endDate: VALID_START.startDate }),
    ).toBe('END_BEFORE_START');
  });
});
