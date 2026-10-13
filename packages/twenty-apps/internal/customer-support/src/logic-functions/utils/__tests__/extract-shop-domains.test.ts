import { describe, expect, it } from 'vitest';

import {
  extractContactEmails,
  extractShopDomains,
} from '../extract-shop-domains.util';

describe('extractShopDomains', () => {
  it('finds the shop wherever the app put it on the session', () => {
    expect(
      extractShopDomains({
        nickname: 'Anna (Praha-Chic.myshopify.com)',
        data: { shop: 'praha-chic.myshopify.com', plan: 'free' },
        segments: ['mida', 'other-shop.myshopify.com'],
      }),
    ).toEqual(['praha-chic.myshopify.com', 'other-shop.myshopify.com']);
  });

  it('returns nothing for a session without a shop', () => {
    expect(
      extractShopDomains({ nickname: 'Visitor 42', email: 'a@b.com' }),
    ).toEqual([]);
  });
});

describe('extractContactEmails', () => {
  it('lists the visitor email first, then emails the app pushed as data', () => {
    expect(
      extractContactEmails({
        email: 'Kim@Probetter.kr',
        data: { bloy_store_email: 'timesavvy@probetter.kr', plan: 'Growth' },
      }),
    ).toEqual(['kim@probetter.kr', 'timesavvy@probetter.kr']);
  });
});
