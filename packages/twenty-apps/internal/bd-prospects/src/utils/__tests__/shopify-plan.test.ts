import { describe, expect, it } from 'vitest';

import { normalizeMerchantPlan, pickHighestPlan } from '../shopify-plan';

describe('normalizeMerchantPlan', () => {
  it("reads BLOY's Shopify handles as the plans they are", () => {
    expect(normalizeMerchantPlan('UNLIMITED')).toBe('ADVANCED');
    expect(normalizeMerchantPlan('SHOPIFY_PLUS')).toBe('PLUS');
    expect(normalizeMerchantPlan('PROFESSIONAL')).toBe('SHOPIFY');
    expect(normalizeMerchantPlan('GROW')).toBe('SHOPIFY');
  });

  it("reads MIDA's normalised names unchanged", () => {
    expect(normalizeMerchantPlan('ADVANCED')).toBe('ADVANCED');
    expect(normalizeMerchantPlan('PLUS')).toBe('PLUS');
    expect(normalizeMerchantPlan('BASIC')).toBe('BASIC');
  });

  it('treats an install state as no plan at all', () => {
    expect(normalizeMerchantPlan('BLOY_UNINSTALLED')).toBeNull();
    expect(normalizeMerchantPlan('INACTIVE')).toBeNull();
    expect(normalizeMerchantPlan('PARTNER_TEST')).toBeNull();
    expect(normalizeMerchantPlan('FROZEN')).toBeNull();
    expect(normalizeMerchantPlan('')).toBeNull();
    expect(normalizeMerchantPlan(null)).toBeNull();
  });

  it('falls back to OTHER for a plan it has never seen', () => {
    expect(normalizeMerchantPlan('some-new-tier')).toBe('OTHER');
  });
});

describe('pickHighestPlan', () => {
  it('should prefer Plus over Advanced', () => {
    expect(pickHighestPlan(['ADVANCED', 'PLUS'])).toBe('PLUS');
  });

  it('should ignore null entries', () => {
    expect(pickHighestPlan([null, 'ADVANCED', undefined])).toBe('ADVANCED');
  });

  it('should normalise casing and whitespace', () => {
    expect(pickHighestPlan([' plus '])).toBe('PLUS');
  });

  it('should fall back to OTHER for an unknown plan', () => {
    expect(pickHighestPlan(['some-new-tier'])).toBe('OTHER');
  });

  it('should return null when nothing is known', () => {
    expect(pickHighestPlan([null, undefined])).toBeNull();
  });

  // The shape of a real prod shop: BLOY reports the uninstall, MIDA still
  // reports the plan. Reading only the first row would blank the column.
  it('reads the plan across a mix of spellings and install markers', () => {
    expect(pickHighestPlan(['BLOY_UNINSTALLED', 'UNLIMITED'])).toBe('ADVANCED');
    expect(pickHighestPlan(['BLOY_UNINSTALLED', 'ADVANCED', 'SHOPIFY_PLUS'])).toBe(
      'PLUS',
    );
  });

  it('returns null when every row only carries an install marker', () => {
    expect(pickHighestPlan(['BLOY_UNINSTALLED', 'INACTIVE'])).toBeNull();
  });
});
