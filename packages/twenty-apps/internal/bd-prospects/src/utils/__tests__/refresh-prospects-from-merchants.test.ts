import { describe, expect, it, vi } from 'vitest';

import { refreshProspectsFromMerchants } from '../refresh-prospect-from-merchants';

const makeClient = () => {
  const queriedShopNames: string[] = [];
  const client = {
    query: vi.fn(async (selection: Record<string, any>) => {
      if (selection.apps) {
        return { apps: { edges: [] } };
      }
      if (selection.prospects) {
        return { prospects: { edges: [] } };
      }
      const nameFilter = selection.merchants?.__args?.filter?.name?.eq;

      if (typeof nameFilter === 'string') {
        queriedShopNames.push(nameFilter);
      }

      return { merchants: { edges: [] } };
    }),
    mutation: vi.fn(async () => ({})),
  };

  return { client, queriedShopNames };
};

describe('refreshProspectsFromMerchants', () => {
  it('rebuilds a shop once when a batch carries several of its merchant rows', async () => {
    const { client, queriedShopNames } = makeClient();

    const results = await refreshProspectsFromMerchants({
      client,
      merchantStillExists: true,
      merchants: [
        { id: 'merchant-1', name: 'shop-a.myshopify.com', appId: 'app-1' },
        { id: 'merchant-2', name: 'shop-a.myshopify.com', appId: 'app-2' },
        { id: 'merchant-3', name: 'shop-b.myshopify.com', appId: 'app-1' },
      ],
    });

    expect(results).toHaveLength(2);
    expect(queriedShopNames.sort()).toEqual([
      'shop-a.myshopify.com',
      'shop-b.myshopify.com',
    ]);
  });
});
