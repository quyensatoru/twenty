import { describe, expect, it } from 'vitest';

import { buildTemplateVariables } from '../build-template-variables.util';

describe('buildTemplateVariables', () => {
  it('derives install status and falls back to the domain', () => {
    expect(
      buildTemplateVariables({
        merchant: {
          id: 'm',
          name: 'acme.myshopify.com',
          using: true,
          storeName: null,
          contactName: null,
          email: null,
        },
        appName: 'MIDA',
        unsubscribeUrl: 'https://x/unsub',
      }),
    ).toMatchObject({
      shopDomain: 'acme.myshopify.com',
      storeName: 'acme.myshopify.com',
      installStatus: 'installed',
    });
    expect(
      buildTemplateVariables({
        merchant: {
          id: 'm',
          name: 'acme.myshopify.com',
          using: false,
          storeName: 'Acme',
          contactName: 'Linh',
          email: { primaryEmail: 'linh@acme.com' },
        },
        appName: 'MIDA',
        unsubscribeUrl: 'https://x/unsub',
      }),
    ).toMatchObject({
      storeName: 'Acme',
      contactName: 'Linh',
      email: 'linh@acme.com',
      installStatus: 'uninstalled',
    });
  });
});
