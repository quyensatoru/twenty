import { describe, expect, it } from 'vitest';

import {
  applyMerchantAppKeys,
  haveAppColumnsChanged,
  splitAppKeys,
} from '../split-app-keys';

describe('splitAppKeys', () => {
  it('should route our apps and other apps to their own column', () => {
    expect(splitAppKeys(['BLOY', 'EU', 'MIDA', 'CHECKOUT_X'])).toEqual({
      ourApps: ['BLOY', 'MIDA'],
      otherApps: ['CHECKOUT_X', 'EU'],
    });
  });

  it('should keep an app nobody declared rather than dropping it', () => {
    expect(splitAppKeys(['BRAND_NEW_APP']).otherApps).toEqual([
      'BRAND_NEW_APP',
    ]);
  });

  it('should merge with what the prospect already had', () => {
    expect(
      splitAppKeys(['MIDA'], { ourApps: ['BLOY'], otherApps: ['EU'] }),
    ).toEqual({ ourApps: ['BLOY', 'MIDA'], otherApps: ['EU'] });
  });

  it('should report no change when the result matches what is stored', () => {
    const previous = { ourApps: ['BLOY'], otherApps: ['EU'] };

    expect(
      haveAppColumnsChanged(splitAppKeys(['BLOY', 'EU'], previous), previous),
    ).toBe(false);
  });

  it('should report a change when a new app appears', () => {
    const previous = { ourApps: ['BLOY'], otherApps: [] };

    expect(
      haveAppColumnsChanged(splitAppKeys(['BLOY', 'EU'], previous), previous),
    ).toBe(true);
  });
});

describe('applyMerchantAppKeys', () => {
  it('should drop one of our apps that no longer has a merchant row', () => {
    expect(
      applyMerchantAppKeys(['MIDA'], {
        ourApps: ['BLOY', 'MIDA'],
        otherApps: [],
      }).ourApps,
    ).toEqual(['MIDA']);
  });

  it('should clear our apps entirely when every merchant row is gone', () => {
    expect(
      applyMerchantAppKeys([], { ourApps: ['BLOY'], otherApps: ['EU'] }),
    ).toEqual({ ourApps: [], otherApps: ['EU'] });
  });

  it('should keep a third-party app that only a CSV ever reported', () => {
    expect(
      applyMerchantAppKeys(['BLOY'], {
        ourApps: [],
        otherApps: ['CHECKOUT_X'],
      }),
    ).toEqual({ ourApps: ['BLOY'], otherApps: ['CHECKOUT_X'] });
  });

  it('should add a third-party app seen on a merchant row', () => {
    expect(
      applyMerchantAppKeys(['EU'], { ourApps: [], otherApps: [] }).otherApps,
    ).toEqual(['EU']);
  });
});
