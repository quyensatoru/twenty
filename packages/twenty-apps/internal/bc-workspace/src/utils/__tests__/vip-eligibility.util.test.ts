import { describe, expect, it } from 'vitest';

import {
  selectVipCandidates,
  type VipEligibilityMerchant,
} from '../vip-eligibility.util';

const merchant = (
  overrides: Partial<VipEligibilityMerchant>,
): VipEligibilityMerchant => ({
  name: 'shop.myshopify.com',
  storeName: null,
  using: true,
  pricingPlan: 'SS_FREE',
  shopifyPlan: 'BASIC',
  appName: 'MIDA',
  ...overrides,
});

describe('selectVipCandidates', () => {
  it('accepts a shop on Shopify Advanced or Plus whatever the app plan', () => {
    expect(selectVipCandidates([merchant({ shopifyPlan: 'SHOPIFY_PLUS' })])).toEqual([
      { shopDomain: 'shop.myshopify.com', name: 'shop.myshopify.com' },
    ]);
  });

  it('accepts a qualifying plan only on its own app', () => {
    expect(selectVipCandidates([merchant({ appName: 'BLOY', pricingPlan: 'GROWTH' })])).toHaveLength(1);
    expect(selectVipCandidates([merchant({ appName: 'MIDA', pricingPlan: 'GROWTH' })])).toHaveLength(0);
    expect(selectVipCandidates([merchant({ appName: 'FRAUD', pricingPlan: 'FR_ADVANCED' })])).toHaveLength(0);
  });

  it('ignores uninstalled apps and Plus trials', () => {
    expect(selectVipCandidates([merchant({ shopifyPlan: 'PLUS', using: false })])).toHaveLength(0);
    expect(selectVipCandidates([merchant({ shopifyPlan: 'PLUS_TRIAL' })])).toHaveLength(0);
  });

  it('drops a shop that is a dev or test store on any live install', () => {
    expect(
      selectVipCandidates([
        merchant({ appName: 'MIDA', pricingPlan: 'SS_ENTERPRISE' }),
        merchant({ appName: 'BLOY', shopifyPlan: 'PARTNER_TEST' }),
      ]),
    ).toHaveLength(0);
    expect(
      selectVipCandidates([merchant({ pricingPlan: 'SS_ENTERPRISE', shopifyPlan: 'BASIC_APP_DEVELOPMENT' })]),
    ).toHaveLength(0);
  });

  it('groups installs by lowercase domain and names the client after a store name', () => {
    expect(
      selectVipCandidates([
        merchant({ name: 'Shop.myshopify.com ', shopifyPlan: 'ADVANCED' }),
        merchant({ appName: 'BLOY', storeName: 'Shop Store', pricingPlan: 'FREE' }),
      ]),
    ).toEqual([{ shopDomain: 'shop.myshopify.com', name: 'Shop Store' }]);
  });
});
