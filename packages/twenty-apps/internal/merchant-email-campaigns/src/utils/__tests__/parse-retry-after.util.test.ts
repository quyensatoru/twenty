import { describe, expect, it } from 'vitest';

import { parseRetryAfter } from '../parse-retry-after.util';

describe('parseRetryAfter', () => {
  it('reads seconds', () => {
    expect(parseRetryAfter('30')).toBe(30_000);
  });

  it('reads an HTTP date relative to now', () => {
    const now = Date.parse('2026-10-30T07:00:00Z');

    expect(parseRetryAfter('Fri, 30 Oct 2026 07:00:20 GMT', now)).toBe(20_000);
  });

  it('ignores a missing or unreadable header', () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter('soon')).toBeUndefined();
  });
});
