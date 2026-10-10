import { describe, expect, it } from 'vitest';

import { extractIssueKeys } from '../extract-issue-keys.util';

describe('extractIssueKeys', () => {
  it('finds keys in branch names, commits and MR titles', () => {
    expect(extractIssueKeys('PROJ-123-cart-totals')).toEqual(['PROJ-123']);
    expect(extractIssueKeys('Fix PROJ-123 and PROJ-45 checkout')).toEqual([
      'PROJ-123',
      'PROJ-45',
    ]);
    expect(extractIssueKeys('[PROJ-7] Rework totals')).toEqual(['PROJ-7']);
  });

  it('uppercases lowercase keys and dedupes in order', () => {
    expect(extractIssueKeys('proj-123 then PROJ-123 then proj-45')).toEqual([
      'PROJ-123',
      'PROJ-45',
    ]);
  });

  it('ignores non-keys and non-strings', () => {
    expect(extractIssueKeys('no keys here')).toEqual([]);
    expect(extractIssueKeys('PROJ-nope')).toEqual([]);
    expect(extractIssueKeys(null)).toEqual([]);
    expect(extractIssueKeys('')).toEqual([]);
  });
});
