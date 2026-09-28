import { describe, expect, it } from 'vitest';

import { DEFAULT_EMAIL_DESIGN } from '../../constants/default-email-design';
import { buildMerchantEmail } from '../build-merchant-email.util';

const template = {
  id: 't',
  subject: 'Hi {{storeName}}',
  previewText: '',
  design: DEFAULT_EMAIL_DESIGN,
};
const base = {
  template,
  appName: 'MIDA',
  unsubscribeUrl: 'https://x.io/u',
  from: 'MIDA <hi@mida.so>',
};

describe('buildMerchantEmail', () => {
  it('skips merchants without an email', () => {
    expect(
      buildMerchantEmail({
        ...base,
        merchant: { id: 'm', name: 'shop.myshopify.com' },
      }),
    ).toEqual({
      kind: 'SKIPPED',
      reason: 'Merchant has no valid email',
      to: '',
    });
  });

  it('skips unsubscribed merchants', () => {
    const result = buildMerchantEmail({
      ...base,
      merchant: {
        id: 'm',
        email: { primaryEmail: 'a@b.io' },
        emailUnsubscribed: true,
      },
    });

    expect(result.kind).toBe('SKIPPED');
  });

  it('builds a lowercased recipient and an interpolated subject', () => {
    const result = buildMerchantEmail({
      ...base,
      merchant: {
        id: 'm',
        name: 'shop.myshopify.com',
        email: { primaryEmail: ' Owner@Shop.IO ' },
      },
    });

    expect(result.kind).toBe('READY');

    if (result.kind === 'READY') {
      expect(result.to).toBe('owner@shop.io');
      expect(result.subject).toBe('Hi shop.myshopify.com');
      expect(result.email.html).toContain('https://x.io/u');
    }
  });
});
