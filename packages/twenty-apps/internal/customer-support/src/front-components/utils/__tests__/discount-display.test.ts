import { describe, expect, it } from 'vitest';

import { type DiscountListItem } from '../../../types/discount';
import {
  addDays,
  filterDiscounts,
  formatDiscountValue,
  readDiscountShop,
  readElapsedShare,
  readValidity,
} from '../discount-display.util';

const DISCOUNT: DiscountListItem = {
  id: 'discount-1',
  name: 'aysfi1-zu.myshopify.com',
  discountCode: 'MIDAHEMA10',
  discountType: 'PERCENTAGE',
  discountValue: 25,
  limitInIntervals: 1,
  limitUsage: 1,
  timesUsed: null,
  startDate: '2026-10-20',
  endDate: '2026-10-29',
  status: true,
  scope: null,
  reason: 'touch point',
  assignedDomains: [],
  appId: 'app-mida',
  appName: 'MIDA',
  merchantId: null,
  merchantName: null,
  syncStatus: 'REJECTED',
  syncError: null,
  syncedAt: null,
  externalId: null,
  nextSyncAt: null,
  createdAt: '2026-10-20T00:00:00.000Z',
  createdByName: 'Xuân PNT',
};

describe('readValidity', () => {
  it('places today inside, before or after the window', () => {
    expect(readValidity(DISCOUNT, '2026-10-23')).toBe('active');
    expect(readValidity(DISCOUNT, '2026-10-19')).toBe('upcoming');
    expect(readValidity(DISCOUNT, '2026-10-30')).toBe('expired');
    expect(readValidity({ startDate: null, endDate: null }, '2026-10-30')).toBe(
      'open',
    );
  });
});

describe('readElapsedShare', () => {
  it('counts both the first and the last day', () => {
    expect(readElapsedShare(DISCOUNT, '2026-10-24')).toBe(0.5);
  });
});

describe('addDays', () => {
  it('rolls over months', () => {
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04');
  });
});

describe('formatDiscountValue', () => {
  it('prints percent and dollars', () => {
    expect(formatDiscountValue('PERCENTAGE', 25)).toBe('25%');
    expect(formatDiscountValue('FIX_AMOUNT', 9.5)).toBe('$9.5');
    expect(formatDiscountValue('PERCENTAGE', null)).toBe('—');
  });
});

describe('readDiscountShop', () => {
  it('falls back to a name that is a shop domain, as older records stored it', () => {
    expect(readDiscountShop(DISCOUNT)).toBe('aysfi1-zu.myshopify.com');
    expect(readDiscountShop({ ...DISCOUNT, name: 'One month free' })).toBeNull();
  });
});

describe('filterDiscounts', () => {
  it('combines app, attention and search', () => {
    const other = {
      ...DISCOUNT,
      id: 'discount-2',
      discountCode: 'FOUNTAIN10',
      appName: 'BLOY',
      syncStatus: 'APPLIED' as const,
    };
    const all = [DISCOUNT, other];

    expect(
      filterDiscounts(all, { appName: 'MIDA', validity: null, attention: false, search: '' }, '2026-10-23'),
    ).toEqual([DISCOUNT]);
    expect(
      filterDiscounts(all, { appName: null, validity: null, attention: true, search: '' }, '2026-10-23'),
    ).toEqual([DISCOUNT]);
    expect(
      filterDiscounts(all, { appName: null, validity: null, attention: false, search: 'hema' }, '2026-10-23'),
    ).toEqual([DISCOUNT]);
  });
});
