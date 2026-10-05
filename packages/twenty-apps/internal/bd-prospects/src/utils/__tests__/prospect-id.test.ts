import { describe, expect, it } from 'vitest';

import { computeProspectId } from '../prospect-id';

const UUID_V5_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('computeProspectId', () => {
  it('should return a valid v5 uuid', () => {
    const id = computeProspectId('abc.myshopify.com');

    expect(id).not.toBeNull();
    expect(id as string).toMatch(UUID_V5_PATTERN);
  });

  it('should be stable across calls', () => {
    expect(computeProspectId('abc.myshopify.com')).toBe(
      computeProspectId('abc.myshopify.com'),
    );
  });

  it('should collapse differently spelled domains onto one id', () => {
    expect(computeProspectId('https://ABC.myshopify.com/')).toBe(
      computeProspectId('abc.myshopify.com'),
    );
  });

  it('should differ between domains', () => {
    expect(computeProspectId('abc.myshopify.com')).not.toBe(
      computeProspectId('xyz.myshopify.com'),
    );
  });

  it('should return null for an unusable domain', () => {
    expect(computeProspectId('not a domain')).toBeNull();
  });
});
