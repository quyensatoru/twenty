import { describe, expect, it } from 'vitest';

import { buildMomentsCardAnchor, parseMomentsCardAnchor } from '../moments-card-anchor.util';

describe('moments card anchor', () => {
  it('round-trips an occurrence key with separators', () => {
    const key = 'event:5ecfdc66-97d1-4731-9e96-b3bf6e6fb3b5:2026-10-20';

    expect(parseMomentsCardAnchor(buildMomentsCardAnchor(key))).toBe(key);
  });

  it('ignores other fragments and malformed escapes', () => {
    expect(parseMomentsCardAnchor('#issue-1')).toBeNull();
    expect(parseMomentsCardAnchor('#card=')).toBeNull();
    expect(parseMomentsCardAnchor('#card=%E0%A4%A')).toBeNull();
    expect(parseMomentsCardAnchor(undefined)).toBeNull();
  });
});
