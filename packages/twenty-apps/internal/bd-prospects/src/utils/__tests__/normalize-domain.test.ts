import { describe, expect, it } from 'vitest';

import { normalizeDomain } from '../normalize-domain';

describe('normalizeDomain', () => {
  it('should lowercase and trim a plain domain', () => {
    expect(normalizeDomain('  ABC.myshopify.COM ')).toBe('abc.myshopify.com');
  });

  it('should strip scheme, path, query and trailing slash', () => {
    expect(normalizeDomain('https://abc.myshopify.com/admin?x=1')).toBe(
      'abc.myshopify.com',
    );
  });

  it('should strip a www prefix and a port', () => {
    expect(normalizeDomain('www.shop.example.com:443')).toBe(
      'shop.example.com',
    );
  });

  it('should collapse the spellings a human types into one value', () => {
    const spellings = [
      'ABC.myshopify.com',
      'abc.myshopify.com/',
      'https://abc.myshopify.com',
      ' www.abc.myshopify.com ',
    ];

    expect(new Set(spellings.map(normalizeDomain)).size).toBe(1);
  });

  it('should reject input without a dot', () => {
    expect(normalizeDomain('localhost')).toBeNull();
  });

  it('should reject empty input', () => {
    expect(normalizeDomain('   ')).toBeNull();
  });

  it('should reject a label with invalid characters', () => {
    expect(normalizeDomain('sh op.example.com')).toBeNull();
    expect(normalizeDomain('shop_1.example.com')).toBeNull();
  });

  it('should reject a label starting or ending with a hyphen', () => {
    expect(normalizeDomain('-shop.example.com')).toBeNull();
    expect(normalizeDomain('shop-.example.com')).toBeNull();
  });

  it('should reject an over-long domain', () => {
    const longDomain = `${`${'a'.repeat(60)}.`.repeat(5)}com`;

    expect(normalizeDomain(longDomain)).toBeNull();
  });
});
