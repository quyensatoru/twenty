import { describe, expect, it } from 'vitest';

import {
  buildDiscountName,
  type DiscountDraft,
  listDiscountWarnings,
  normalizeDiscountCode,
  resolveAssignedDomains,
  suggestDiscountCode,
  validateDiscountDraft,
} from '../discount-rules.util';

const DRAFT: DiscountDraft = {
  appId: 'app-mida',
  appName: 'MIDA',
  scope: 'SINGLE',
  merchantId: 'merchant-1',
  merchantDomain: 'aysfi1-zu.myshopify.com',
  assignedDomains: [],
  discountType: 'PERCENTAGE',
  discountValue: 25,
  limitInIntervals: 1,
  limitUsage: 1,
  startDate: '2026-10-23',
  endDate: '2026-10-30',
  discountCode: 'MIDA25-AYSFI1',
  reason: 'Touch point',
  status: true,
};

describe('validateDiscountDraft', () => {
  it('accepts a complete discount', () => {
    expect(validateDiscountDraft(DRAFT)).toEqual([]);
  });

  it('takes percentages as whole numbers, so 25 is valid and 120 is not', () => {
    expect(validateDiscountDraft({ ...DRAFT, discountValue: 120 })).toEqual([
      { field: 'discountValue', code: 'over_hundred_percent' },
    ]);
    expect(
      validateDiscountDraft({
        ...DRAFT,
        discountType: 'FIX_AMOUNT',
        discountValue: 120,
      }),
    ).toEqual([]);
  });

  it('needs the merchant for one merchant and shops for a list', () => {
    expect(
      validateDiscountDraft({ ...DRAFT, merchantId: null }).map(
        (error) => error.field,
      ),
    ).toEqual(['merchantId']);
    expect(
      validateDiscountDraft({ ...DRAFT, scope: 'MULTI', assignedDomains: [] }),
    ).toEqual([{ field: 'assignedDomains', code: 'required' }]);
    expect(
      validateDiscountDraft({
        ...DRAFT,
        scope: 'MULTI',
        assignedDomains: ['not a domain'],
      }),
    ).toEqual([{ field: 'assignedDomains', code: 'domain_format' }]);
  });

  it('rejects an end before the start and a bad code', () => {
    expect(
      validateDiscountDraft({
        ...DRAFT,
        endDate: '2026-10-01',
        discountCode: '100G=HUD',
      }),
    ).toEqual([
      { field: 'endDate', code: 'end_before_start' },
      { field: 'discountCode', code: 'code_format' },
    ]);
  });

  it('wants whole billing cycles and uses', () => {
    expect(
      validateDiscountDraft({ ...DRAFT, limitInIntervals: 1.5, limitUsage: 0 }),
    ).toEqual([
      { field: 'limitInIntervals', code: 'not_whole' },
      { field: 'limitUsage', code: 'not_positive' },
    ]);
  });
});

describe('normalizeDiscountCode', () => {
  it('uppercases and drops whitespace, including a trailing tab', () => {
    expect(normalizeDiscountCode(' bloy_chloe10\t')).toBe('BLOY_CHLOE10');
  });
});

describe('resolveAssignedDomains', () => {
  it('sends the merchant for one merchant, the cleaned list for many, nothing for all', () => {
    expect(resolveAssignedDomains(DRAFT)).toEqual(['aysfi1-zu.myshopify.com']);
    expect(
      resolveAssignedDomains({
        ...DRAFT,
        scope: 'MULTI',
        assignedDomains: [
          'https://A.myshopify.com/admin',
          'a.myshopify.com',
          ' ',
          'b.myshopify.com',
        ],
      }),
    ).toEqual(['a.myshopify.com', 'b.myshopify.com']);
    expect(resolveAssignedDomains({ ...DRAFT, scope: 'ALL' })).toEqual([]);
  });
});

describe('listDiscountWarnings', () => {
  it('warns that BLOY ignores the shop list', () => {
    expect(listDiscountWarnings({ ...DRAFT, appName: 'BLOY' })).toEqual([
      'app_ignores_assigned_domains',
    ]);
    expect(
      listDiscountWarnings({ ...DRAFT, appName: 'BLOY', scope: 'ALL' }),
    ).toEqual([]);
    expect(listDiscountWarnings(DRAFT)).toEqual([]);
  });
});

describe('suggestDiscountCode', () => {
  it('joins app, amount and the shop handle', () => {
    expect(suggestDiscountCode(DRAFT)).toBe('MIDA25-AYSFI1');
    expect(
      suggestDiscountCode({
        ...DRAFT,
        discountType: 'FIX_AMOUNT',
        discountValue: 10,
        merchantDomain: null,
      }),
    ).toBe('MIDA10USD');
  });
});

describe('buildDiscountName', () => {
  it('names the code after who can use it', () => {
    expect(
      buildDiscountName({
        discountCode: 'MIDA25',
        scope: 'SINGLE',
        merchantDomain: 'a.myshopify.com',
        assignedDomains: [],
      }),
    ).toBe('MIDA25 · a.myshopify.com');
    expect(
      buildDiscountName({
        discountCode: 'BFCM',
        scope: 'ALL',
        merchantDomain: null,
        assignedDomains: [],
      }),
    ).toBe('BFCM · all shops');
  });
});
