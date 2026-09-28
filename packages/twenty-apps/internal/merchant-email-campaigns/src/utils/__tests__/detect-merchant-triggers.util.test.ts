import { describe, expect, it } from 'vitest';

import { detectMerchantTriggers } from '../detect-merchant-triggers.util';

describe('detectMerchantTriggers', () => {
  it('treats a created installed row as an install', () => {
    expect(detectMerchantTriggers({ after: { id: 'm', using: true } })).toEqual(
      ['INSTALLED'],
    );
    expect(
      detectMerchantTriggers({ after: { id: 'm', using: false } }),
    ).toEqual([]);
  });

  it('detects uninstall and reinstall', () => {
    expect(
      detectMerchantTriggers({
        before: { id: 'm', using: true },
        after: { id: 'm', using: false },
      }),
    ).toEqual(['UNINSTALLED']);
    expect(
      detectMerchantTriggers({
        before: { id: 'm', using: false },
        after: { id: 'm', using: true },
      }),
    ).toEqual(['INSTALLED']);
  });

  it('does not treat a first plan fill as a change', () => {
    expect(
      detectMerchantTriggers({
        before: { id: 'm', shopifyPlan: null, pricingPlan: '' },
        after: { id: 'm', shopifyPlan: 'BASIC', pricingPlan: 'FREE' },
      }),
    ).toEqual([]);
  });

  it('detects plan changes', () => {
    expect(
      detectMerchantTriggers({
        before: { id: 'm', shopifyPlan: 'BASIC', pricingPlan: 'FREE' },
        after: { id: 'm', shopifyPlan: 'PLUS', pricingPlan: 'SS_GROWTH' },
      }),
    ).toEqual(['SHOPIFY_PLAN_CHANGED', 'PRICING_PLAN_CHANGED']);
  });
});
