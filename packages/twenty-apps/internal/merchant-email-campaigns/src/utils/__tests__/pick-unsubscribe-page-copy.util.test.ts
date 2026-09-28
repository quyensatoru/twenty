import { describe, expect, it } from 'vitest';

import { pickUnsubscribePageCopy } from '../pick-unsubscribe-page-copy.util';

describe('pickUnsubscribePageCopy', () => {
  it('follows the first supported browser language', () => {
    expect(pickUnsubscribePageCopy('vi-VN,vi;q=0.9,en;q=0.8').lang).toBe('vi');
    expect(pickUnsubscribePageCopy('fr-FR,en;q=0.5').lang).toBe('en');
  });

  it('defaults to English', () => {
    expect(pickUnsubscribePageCopy(undefined).lang).toBe('en');
  });
});
