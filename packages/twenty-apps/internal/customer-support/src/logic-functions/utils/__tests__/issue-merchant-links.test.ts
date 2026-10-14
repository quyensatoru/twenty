import { describe, expect, it } from 'vitest';

import { linkMerchantToIssues } from '../issue-merchant-links.util';

type IssueMerchantRow = {
  id: string;
  issueId: string;
  merchantId: string;
  appId: string | null;
  deletedAt: string | null;
};

type Filter = {
  and: [
    { merchantId: { eq: string } },
    { issueId: { in: string[] } },
    { deletedAt: { is: string } }?,
  ];
};

// Serves the junction the way the API does: soft-deleted rows only when the
// filter asks for them, and records every write.
const createClient = (rows: IssueMerchantRow[]) => {
  const writes: Record<string, unknown>[] = [];

  return {
    writes,
    query: async (request: {
      issueMerchants: { __args: { filter: Filter } };
    }) => {
      const [merchant, issues, deleted] =
        request.issueMerchants.__args.filter.and;
      const wantsDeleted = deleted !== undefined;

      return {
        issueMerchants: {
          edges: rows
            .filter(
              (row) =>
                row.merchantId === merchant.merchantId.eq &&
                issues.issueId.in.includes(row.issueId) &&
                (row.deletedAt !== null) === wantsDeleted,
            )
            .map((node) => ({ node })),
        },
      };
    },
    mutation: async (request: Record<string, unknown>) => {
      writes.push(request);

      return {};
    },
  };
};

const MERCHANT = { id: 'merchant-1', appId: 'app-bloy' };

describe('linkMerchantToIssues', () => {
  it('creates the missing links with the merchant app', async () => {
    const client = createClient([]);

    await linkMerchantToIssues({
      client,
      merchant: MERCHANT,
      issueIds: ['issue-1'],
    });

    expect(client.writes).toEqual([
      {
        createIssueMerchant: {
          __args: {
            data: {
              issueId: 'issue-1',
              merchantId: 'merchant-1',
              appId: 'app-bloy',
            },
          },
          id: true,
        },
      },
    ]);
  });

  it('leaves an existing link alone', async () => {
    const client = createClient([
      {
        id: 'row-1',
        issueId: 'issue-1',
        merchantId: 'merchant-1',
        appId: 'app-bloy',
        deletedAt: null,
      },
    ]);

    await linkMerchantToIssues({
      client,
      merchant: MERCHANT,
      issueIds: ['issue-1'],
    });

    expect(client.writes).toEqual([]);
  });

  it('restores a link removed earlier instead of creating a duplicate', async () => {
    const client = createClient([
      {
        id: 'row-1',
        issueId: 'issue-1',
        merchantId: 'merchant-1',
        appId: null,
        deletedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);

    await linkMerchantToIssues({
      client,
      merchant: MERCHANT,
      issueIds: ['issue-1'],
    });

    expect(client.writes).toEqual([
      { restoreIssueMerchant: { __args: { id: 'row-1' }, id: true } },
      {
        updateIssueMerchant: {
          __args: { id: 'row-1', data: { appId: 'app-bloy' } },
          id: true,
        },
      },
    ]);
  });
});
