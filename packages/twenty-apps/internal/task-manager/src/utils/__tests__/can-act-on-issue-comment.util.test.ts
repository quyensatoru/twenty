import { describe, expect, it } from 'vitest';

import { canActOnIssueComment } from '../can-act-on-issue-comment.util';

describe('canActOnIssueComment', () => {
  it('lets the author act', () => {
    expect(
      canActOnIssueComment({
        commentAuthorId: 'member-1',
        callerWorkspaceMemberId: 'member-1',
        canBypassAppScope: false,
      }),
    ).toBe(true);
  });

  it('refuses another member', () => {
    expect(
      canActOnIssueComment({
        commentAuthorId: 'member-1',
        callerWorkspaceMemberId: 'member-2',
        canBypassAppScope: false,
      }),
    ).toBe(false);
  });

  it('lets a bypassing caller act on anyone comment', () => {
    expect(
      canActOnIssueComment({
        commentAuthorId: 'member-1',
        callerWorkspaceMemberId: 'member-2',
        canBypassAppScope: true,
      }),
    ).toBe(true);
  });

  it('refuses an authorless comment for a non-bypassing caller', () => {
    expect(
      canActOnIssueComment({
        commentAuthorId: null,
        callerWorkspaceMemberId: 'member-1',
        canBypassAppScope: false,
      }),
    ).toBe(false);
  });
});
