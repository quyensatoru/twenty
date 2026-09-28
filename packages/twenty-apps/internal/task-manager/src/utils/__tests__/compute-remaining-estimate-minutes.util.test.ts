import { describe, expect, it } from 'vitest';

import { computeRemainingEstimateMinutes } from '../compute-remaining-estimate-minutes.util';
import { buildIssueKey, hasIssueKey } from '../build-issue-key.util';
import { isUniqueConstraintError } from '../is-unique-constraint-error.util';

describe('computeRemainingEstimateMinutes', () => {
  it('subtracts logged time from the original estimate', () => {
    expect(
      computeRemainingEstimateMinutes({
        originalEstimateMinutes: 120,
        timeSpentMinutes: 45,
      }),
    ).toBe(75);
  });

  it('floors at zero when more time was logged than estimated', () => {
    expect(
      computeRemainingEstimateMinutes({
        originalEstimateMinutes: 30,
        timeSpentMinutes: 90,
      }),
    ).toBe(0);
  });

  it('stays null without an original estimate', () => {
    expect(
      computeRemainingEstimateMinutes({
        originalEstimateMinutes: null,
        timeSpentMinutes: 90,
      }),
    ).toBeNull();
  });
});

describe('hasIssueKey', () => {
  // A never-set TEXT column reads back as '', so an "is defined" check alone
  // would treat every issue as already keyed.
  it('treats an empty string as unkeyed', () => {
    expect(hasIssueKey('')).toBe(false);
    expect(hasIssueKey(null)).toBe(false);
    expect(hasIssueKey('WR-1')).toBe(true);
  });
});

describe('buildIssueKey', () => {
  it('joins the project key and the issue number', () => {
    expect(buildIssueKey('WR', 12)).toBe('WR-12');
  });
});

describe('isUniqueConstraintError', () => {
  it('recognises a Postgres unique violation by message', () => {
    expect(
      isUniqueConstraintError(
        new Error('duplicate key value violates unique constraint "issueKey"'),
      ),
    ).toBe(true);
  });

  it('leaves unrelated errors alone', () => {
    expect(isUniqueConstraintError(new Error('network down'))).toBe(false);
  });
});
