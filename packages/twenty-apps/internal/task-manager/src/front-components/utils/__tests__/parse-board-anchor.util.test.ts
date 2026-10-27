import { describe, expect, it } from 'vitest';

import {
  parseBoardIssueAnchor,
  parseBoardActivityAnchor,
  parseBoardViewAnchor,
} from '../parse-board-anchor.util';

describe('parseBoardIssueAnchor', () => {
  it('reads an issue anchor', () => {
    expect(parseBoardIssueAnchor('issue-abc')).toBe('abc');
  });

  it('tolerates a leading hash and surrounding space', () => {
    expect(parseBoardIssueAnchor('  #issue-abc ')).toBe('abc');
  });

  it('returns nothing for a fragment it does not own', () => {
    expect(parseBoardIssueAnchor('')).toBeNull();
    expect(parseBoardIssueAnchor('comment-abc')).toBeNull();
    expect(parseBoardIssueAnchor(null)).toBeNull();
    expect(parseBoardIssueAnchor(undefined)).toBeNull();
  });

  it('returns nothing for a prefix with no id behind it', () => {
    expect(parseBoardIssueAnchor('issue-')).toBeNull();
  });

  it('opens the issue modal for a linked comment', () => {
    expect(parseBoardIssueAnchor('issue-issue-1/comment-comment-1')).toBe(
      'issue-1',
    );
  });
});

describe('parseBoardActivityAnchor', () => {
  it('finds the comment or worklog within an issue modal', () => {
    expect(parseBoardActivityAnchor('issue-issue-1/comment-comment-1')).toEqual(
      {
        issueId: 'issue-1',
        activity: { kind: 'comment', id: 'comment-1' },
      },
    );
    expect(parseBoardActivityAnchor('issue-issue-1/worklog-worklog-1')).toEqual(
      {
        issueId: 'issue-1',
        activity: { kind: 'worklog', id: 'worklog-1' },
      },
    );
  });
});

describe('parseBoardViewAnchor', () => {
  it('reads the insights and board fragments', () => {
    expect(parseBoardViewAnchor('#insights')).toBe('insights');
    expect(parseBoardViewAnchor(' #board')).toBe('board');
  });

  it('leaves the view to the stored choice otherwise', () => {
    expect(parseBoardViewAnchor('#issue-1')).toBeNull();
    expect(parseBoardViewAnchor('')).toBeNull();
    expect(parseBoardViewAnchor(undefined)).toBeNull();
  });
});
