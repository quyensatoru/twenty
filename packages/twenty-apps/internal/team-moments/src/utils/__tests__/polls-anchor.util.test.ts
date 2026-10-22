import { describe, expect, it } from 'vitest';

import { buildPollAnchor, parsePollAnchor } from '../polls-anchor.util';

describe('polls anchor', () => {
  it('round-trips a poll id', () => {
    const id = '5ecfdc66-97d1-4731-9e96-b3bf6e6fb3b5';

    expect(parsePollAnchor(buildPollAnchor(id))).toBe(id);
  });

  it('ignores other fragments and malformed escapes', () => {
    expect(parsePollAnchor('#issue-1')).toBeNull();
    expect(parsePollAnchor('#poll=')).toBeNull();
    expect(parsePollAnchor('#poll=%E0%A4%A')).toBeNull();
    expect(parsePollAnchor(undefined)).toBeNull();
  });
});
