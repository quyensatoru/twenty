import { describe, expect, it } from 'vitest';

import { resolveIssueStatusChange } from '../resolve-issue-status-change.util';

describe('resolveIssueStatusChange', () => {
  it('returns null when the status did not move', () => {
    expect(
      resolveIssueStatusChange({
        before: { statusId: 'status-a' },
        after: { statusId: 'status-a' },
      }),
    ).toBeNull();
  });

  it('returns null when both sides carry no status', () => {
    expect(
      resolveIssueStatusChange({ before: {}, after: { statusId: null } }),
    ).toBeNull();
  });

  it('returns null when the update carries no status key at all', () => {
    expect(
      resolveIssueStatusChange({
        before: { statusId: 'status-a' },
        after: {},
      }),
    ).toBeNull();
  });

  it('returns null when either snapshot is missing', () => {
    expect(resolveIssueStatusChange({})).toBeNull();
    expect(
      resolveIssueStatusChange({ before: null, after: null }),
    ).toBeNull();
  });

  it('reports a status assigned onto no status', () => {
    expect(
      resolveIssueStatusChange({
        before: { statusId: null },
        after: { statusId: 'status-b' },
      }),
    ).toEqual({ fromStatusId: null, toStatusId: 'status-b' });
  });

  it('reports a move between two statuses', () => {
    expect(
      resolveIssueStatusChange({
        before: { statusId: 'status-a' },
        after: { statusId: 'status-b' },
      }),
    ).toEqual({ fromStatusId: 'status-a', toStatusId: 'status-b' });
  });

  it('reports a status cleared back to none', () => {
    expect(
      resolveIssueStatusChange({
        before: { statusId: 'status-a' },
        after: { statusId: null },
      }),
    ).toEqual({ fromStatusId: 'status-a', toStatusId: null });
  });
});
