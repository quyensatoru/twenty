import { describe, expect, it } from 'vitest';

import {
  parseBoardIssueAnchor,
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
});

describe('parseBoardViewAnchor', () => {
  it('reads the backlog and board fragments', () => {
    expect(parseBoardViewAnchor('#backlog')).toBe('backlog');
    expect(parseBoardViewAnchor(' #board')).toBe('board');
  });

  it('leaves the view to the stored choice otherwise', () => {
    expect(parseBoardViewAnchor('#issue-1')).toBeNull();
    expect(parseBoardViewAnchor('')).toBeNull();
    expect(parseBoardViewAnchor(undefined)).toBeNull();
  });
});
