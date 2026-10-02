import { describe, expect, it } from 'vitest';

import { parseActivityAnchor } from '../parse-activity-anchor.util';

describe('parseActivityAnchor', () => {
  it('reads a comment anchor', () => {
    expect(parseActivityAnchor('comment-abc')).toEqual({
      kind: 'comment',
      id: 'abc',
    });
  });

  it('reads a worklog anchor', () => {
    expect(parseActivityAnchor('worklog-abc')).toEqual({
      kind: 'worklog',
      id: 'abc',
    });
  });

  it('tolerates a leading hash and surrounding space', () => {
    expect(parseActivityAnchor('  #comment-abc ')).toEqual({
      kind: 'comment',
      id: 'abc',
    });
  });

  it('returns nothing for a fragment it does not own', () => {
    expect(parseActivityAnchor('')).toBeNull();
    expect(parseActivityAnchor('section-overview')).toBeNull();
    expect(parseActivityAnchor(null)).toBeNull();
    expect(parseActivityAnchor(undefined)).toBeNull();
  });

  it('returns nothing for a prefix with no id behind it', () => {
    expect(parseActivityAnchor('comment-')).toBeNull();
  });
});
