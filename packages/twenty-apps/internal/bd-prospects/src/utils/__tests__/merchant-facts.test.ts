import { describe, expect, it } from 'vitest';

import { type MerchantRow } from '../api-types';
import { collectInstalledAppKeys, pickMerchantEmail } from '../merchant-facts';

const BLOY_APP_ID = 'app-bloy';
const MIDA_APP_ID = 'app-mida';
const FRAUD_APP_ID = 'app-fraud';

const appKeyById = new Map([
  [BLOY_APP_ID, 'BLOY'],
  [MIDA_APP_ID, 'MIDA'],
  [FRAUD_APP_ID, 'FRAUD'],
]);

const merchant = (overrides: Partial<MerchantRow>): MerchantRow => ({
  id: 'merchant-1',
  name: 'shop.myshopify.com',
  appId: BLOY_APP_ID,
  shopifyPlan: 'UNLIMITED',
  prospectId: null,
  ...overrides,
});

describe('collectInstalledAppKeys', () => {
  it('drops an app the shop has removed', () => {
    expect(
      collectInstalledAppKeys(
        [
          merchant({ id: '1', appId: BLOY_APP_ID, using: false }),
          merchant({ id: '2', appId: MIDA_APP_ID, using: true }),
        ],
        appKeyById,
      ),
    ).toEqual(['MIDA']);
  });

  it('counts a row whose flag was never written', () => {
    expect(
      collectInstalledAppKeys(
        [merchant({ appId: BLOY_APP_ID, using: null })],
        appKeyById,
      ),
    ).toEqual(['BLOY']);
  });

  it('ignores a row pointing at an app that is not registered', () => {
    expect(
      collectInstalledAppKeys(
        [merchant({ appId: 'app-unknown', using: true })],
        appKeyById,
      ),
    ).toEqual([]);
  });
});

describe('pickMerchantEmail', () => {
  it('prefers the address on an app the shop still runs', () => {
    expect(
      pickMerchantEmail([
        merchant({
          id: '1',
          using: false,
          email: { primaryEmail: 'old@shop.com' },
        }),
        merchant({
          id: '2',
          using: true,
          email: { primaryEmail: 'live@shop.com' },
        }),
      ]),
    ).toBe('live@shop.com');
  });

  it('falls back to an uninstalled row rather than nothing', () => {
    expect(
      pickMerchantEmail([
        merchant({ id: '1', using: true, email: null }),
        merchant({
          id: '2',
          using: false,
          email: { primaryEmail: 'old@shop.com' },
        }),
      ]),
    ).toBe('old@shop.com');
  });

  it('returns null when no row carries one', () => {
    expect(
      pickMerchantEmail([
        merchant({ id: '1', email: null }),
        merchant({ id: '2', email: { primaryEmail: '  ' } }),
      ]),
    ).toBeNull();
  });
});
