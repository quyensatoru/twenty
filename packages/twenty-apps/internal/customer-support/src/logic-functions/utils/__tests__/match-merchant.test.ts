import { describe, expect, it } from 'vitest';

import { matchMerchant } from '../match-merchant.util';

type MerchantRow = {
  id: string;
  name: string;
  appId: string | null;
  email?: string;
};

const APPS = [
  { id: 'app-bloy', name: 'BLOY' },
  { id: 'app-eu', name: 'EU' },
];

// Answers the two queries matchMerchant makes: the app registry and the
// merchants by shop domain or by email.
const createClient = (merchants: MerchantRow[]) => ({
  query: async (request: Record<string, { __args: { filter: never } }>) => {
    if ('apps' in request) {
      const name = (request.apps.__args.filter as { name: { eq: string } })
        .name.eq;

      return {
        apps: {
          edges: APPS.filter((app) => app.name === name).map((node) => ({
            node,
          })),
        },
      };
    }

    const [, filter] = (
      request.merchants.__args.filter as {
        and: [
          unknown,
          {
            name?: { in: string[] };
            or?: { email: { primaryEmail: { ilike: string } } }[];
          },
        ];
      }
    ).and;
    const matches = merchants.filter((merchant) =>
      filter.name !== undefined
        ? filter.name.in.includes(merchant.name)
        : (filter.or ?? []).some(
            (condition) =>
              condition.email.primaryEmail.ilike === merchant.email,
          ),
    );

    return { merchants: { edges: matches.map((node) => ({ node })) } };
  },
});

describe('matchMerchant', () => {
  it("links a shop's chat to that product's merchant row", async () => {
    const client = createClient([
      { id: 'bloy-row', name: 'shop.myshopify.com', appId: 'app-bloy' },
      { id: 'eu-row', name: 'shop.myshopify.com', appId: 'app-eu' },
    ]);

    await expect(
      matchMerchant({
        client,
        appName: 'EU',
        shopDomains: ['shop.myshopify.com'],
        emails: [],
      }),
    ).resolves.toEqual({
      merchantId: 'eu-row',
      shopDomain: 'shop.myshopify.com',
    });
  });

  it("never falls back to another product's merchant row", async () => {
    const client = createClient([
      { id: 'bloy-row', name: 'shop.myshopify.com', appId: 'app-bloy' },
    ]);

    await expect(
      matchMerchant({
        client,
        appName: 'EU',
        shopDomains: ['shop.myshopify.com'],
        emails: [],
      }),
    ).resolves.toBeUndefined();
  });

  it('matches by email within the same product when the shop is unknown', async () => {
    const client = createClient([
      {
        id: 'bloy-row',
        name: 'shop.myshopify.com',
        appId: 'app-bloy',
        email: 'owner@shop.com',
      },
    ]);

    await expect(
      matchMerchant({
        client,
        appName: 'BLOY',
        shopDomains: [],
        emails: ['owner@shop.com'],
      }),
    ).resolves.toEqual({
      merchantId: 'bloy-row',
      shopDomain: 'shop.myshopify.com',
    });
  });
});
