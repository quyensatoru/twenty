import { describe, expect, it } from 'vitest';

import { buildMerchantChangeProperties } from '../build-merchant-change-properties.util';

describe('buildMerchantChangeProperties', () => {
  it('returns old and new values for changed columns', () => {
    expect(
      buildMerchantChangeProperties({
        before: {
          id: 'm',
          shopifyPlan: 'BASIC',
          pricingPlan: 'FREE',
          contactName: 'Old Owner',
          email: { primaryEmail: 'old@shop.com' },
        },
        after: {
          id: 'm',
          shopifyPlan: 'PLUS',
          pricingPlan: 'FREE',
          contactName: 'Old Owner',
          email: { primaryEmail: 'old@shop.com' },
        },
      }),
    ).toEqual({
      oldShopifyPlan: 'BASIC',
      newShopifyPlan: 'PLUS',
      oldPricingPlan: 'FREE',
      newPricingPlan: 'FREE',
      oldContactName: 'Old Owner',
      newContactName: 'Old Owner',
      oldEmail: 'old@shop.com',
      newEmail: 'old@shop.com',
    });
  });

  it('returns nothing for a created row or missing sides', () => {
    expect(
      buildMerchantChangeProperties({
        after: { id: 'm', shopifyPlan: 'PLUS' },
      }),
    ).toEqual({});
    expect(
      buildMerchantChangeProperties({
        before: { id: 'm' },
        after: { id: 'm', shopifyPlan: 'PLUS' },
      }),
    ).toEqual({});
  });
});
