import { describe, expect, it } from 'vitest';

import { sha1, toHex } from '../sha1';

const digestOf = (value: string): string =>
  toHex(sha1(new TextEncoder().encode(value)));

describe('sha1', () => {
  it('should match the RFC 3174 test vectors', () => {
    expect(digestOf('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
    expect(digestOf('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(
      digestOf('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    ).toBe('84983e441c3bd26ebaae4aa1f95129e5e54670f1');
  });

  it('should handle input spanning several blocks', () => {
    expect(digestOf('a'.repeat(1000000).slice(0, 200))).toBe(
      toHex(sha1(new TextEncoder().encode('a'.repeat(200)))),
    );
    expect(digestOf('a'.repeat(64))).toBe(
      '0098ba824b5c16427bd7a1122a5a442a25ec644d',
    );
  });
});
