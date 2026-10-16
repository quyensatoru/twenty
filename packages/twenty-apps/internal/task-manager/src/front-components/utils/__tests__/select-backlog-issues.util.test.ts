import { describe, expect, it } from 'vitest';

import { selectBacklogIssues } from '../select-backlog-issues.util';

const VISIBLE_ISSUE_IDS = ['a', 'b', 'c', 'd', 'e'];

describe('selectBacklogIssues', () => {
  it('toggles a row on and moves the anchor to it', () => {
    expect(
      selectBacklogIssues({
        selection: { selectedIssueIds: [], anchorIssueId: null },
        visibleIssueIds: VISIBLE_ISSUE_IDS,
        issueId: 'b',
        isRange: false,
      }),
    ).toEqual({ selectedIssueIds: ['b'], anchorIssueId: 'b' });
  });

  it('toggles a selected row off', () => {
    expect(
      selectBacklogIssues({
        selection: { selectedIssueIds: ['b', 'c'], anchorIssueId: 'b' },
        visibleIssueIds: VISIBLE_ISSUE_IDS,
        issueId: 'b',
        isRange: false,
      }).selectedIssueIds,
    ).toEqual(['c']);
  });

  it('adds every row between the anchor and a Shift-clicked row, either direction', () => {
    expect(
      selectBacklogIssues({
        selection: { selectedIssueIds: ['b'], anchorIssueId: 'b' },
        visibleIssueIds: VISIBLE_ISSUE_IDS,
        issueId: 'd',
        isRange: true,
      }),
    ).toEqual({ selectedIssueIds: ['b', 'c', 'd'], anchorIssueId: 'b' });

    expect(
      selectBacklogIssues({
        selection: { selectedIssueIds: ['d', 'e'], anchorIssueId: 'd' },
        visibleIssueIds: VISIBLE_ISSUE_IDS,
        issueId: 'a',
        isRange: true,
      }).selectedIssueIds,
    ).toEqual(['d', 'e', 'a', 'b', 'c']);
  });

  it('falls back to a toggle when the anchor is no longer visible', () => {
    expect(
      selectBacklogIssues({
        selection: { selectedIssueIds: ['z'], anchorIssueId: 'z' },
        visibleIssueIds: VISIBLE_ISSUE_IDS,
        issueId: 'c',
        isRange: true,
      }),
    ).toEqual({ selectedIssueIds: ['z', 'c'], anchorIssueId: 'c' });
  });
});
