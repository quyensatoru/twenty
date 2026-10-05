import { describe, expect, it } from 'vitest';

import { detectMerchantEventNames } from '../detect-merchant-event-names.util';

describe('detectMerchantEventNames', () => {
  it('treats a created installed row as an install', () => {
    expect(
      detectMerchantEventNames({ after: { id: 'm', using: true } }),
    ).toEqual(['merchant.installed']);
    expect(
      detectMerchantEventNames({ after: { id: 'm', using: false } }),
    ).toEqual([]);
  });

  it('detects uninstall and reinstall', () => {
    expect(
      detectMerchantEventNames({
        before: { id: 'm', using: true },
        after: { id: 'm', using: false },
      }),
    ).toEqual(['merchant.uninstalled']);
    expect(
      detectMerchantEventNames({
        before: { id: 'm', using: false },
        after: { id: 'm', using: true },
      }),
    ).toEqual(['merchant.installed']);
  });

  it('does not treat a first plan fill as a change', () => {
    expect(
      detectMerchantEventNames({
        before: { id: 'm', shopifyPlan: null, pricingPlan: '' },
        after: { id: 'm', shopifyPlan: 'BASIC', pricingPlan: 'FREE' },
      }),
    ).toEqual([]);
  });

  it('detects plan changes', () => {
    expect(
      detectMerchantEventNames({
        before: { id: 'm', shopifyPlan: 'BASIC', pricingPlan: 'FREE' },
        after: { id: 'm', shopifyPlan: 'PLUS', pricingPlan: 'SS_GROWTH' },
      }),
    ).toEqual([
      'merchant.shopify_plan_changed',
      'merchant.pricing_plan_changed',
    ]);
  });

  it('detects opt-out even on first set', () => {
    expect(
      detectMerchantEventNames({
        before: { id: 'm', emailUnsubscribed: null },
        after: { id: 'm', emailUnsubscribed: true },
      }),
    ).toEqual(['merchant.unsubscribed']);
    expect(
      detectMerchantEventNames({
        before: { id: 'm', emailUnsubscribed: true },
        after: { id: 'm', emailUnsubscribed: true },
      }),
    ).toEqual([]);
  });

  it('detects contact and email changes, ignoring first fills', () => {
    expect(
      detectMerchantEventNames({
        before: {
          id: 'm',
          contactName: 'Old Owner',
          email: { primaryEmail: 'old@shop.com' },
        },
        after: {
          id: 'm',
          contactName: 'New Owner',
          email: { primaryEmail: 'new@shop.com' },
        },
      }),
    ).toEqual(['merchant.email_changed', 'merchant.contact_changed']);
    expect(
      detectMerchantEventNames({
        before: { id: 'm', contactName: null, email: null },
        after: {
          id: 'm',
          contactName: 'New Owner',
          email: { primaryEmail: 'new@shop.com' },
        },
      }),
    ).toEqual([]);
  });
});
