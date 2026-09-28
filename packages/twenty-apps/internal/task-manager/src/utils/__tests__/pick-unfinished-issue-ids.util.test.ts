import { describe, expect, it } from 'vitest';

import { pickUnfinishedIssueIds } from '../pick-unfinished-issue-ids.util';

describe('pickUnfinishedIssueIds', () => {
  it('keeps issues whose status is not in a DONE category', () => {
    expect(
      pickUnfinishedIssueIds({
        issues: [
          { id: 'issue-1', statusId: 'todo' },
          { id: 'issue-2', statusId: 'done' },
        ],
        doneStatusIds: ['done'],
      }),
    ).toEqual(['issue-1']);
  });

  it('treats an issue with no status as unfinished', () => {
    expect(
      pickUnfinishedIssueIds({
        issues: [{ id: 'issue-1', statusId: null }],
        doneStatusIds: ['done'],
      }),
    ).toEqual(['issue-1']);
  });

  it('moves nothing when every issue is done', () => {
    expect(
      pickUnfinishedIssueIds({
        issues: [{ id: 'issue-1', statusId: 'done' }],
        doneStatusIds: ['done'],
      }),
    ).toEqual([]);
  });
});
