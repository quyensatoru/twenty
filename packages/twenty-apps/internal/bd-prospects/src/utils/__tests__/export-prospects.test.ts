import { describe, expect, it } from 'vitest';
import { read, utils } from 'xlsx-ugnis';

import {
  buildProspectExportFiles,
  fetchProspectsForExport,
  type ProspectExportClient,
  type ProspectExportFilter,
  type ProspectExportRow,
} from '../export-prospects';
import { PROSPECT_EXPORT_FIELDS } from '../prospect-export-configuration';

const prospect = (index: number): ProspectExportRow => ({
  id: `prospect-${index}`,
  domain: `shop-${index}.myshopify.com`,
  email: { primaryEmail: `owner-${index}@shop.com` },
  linkedinPage: {
    primaryLinkUrl: `https://linkedin.com/company/shop-${index}`,
  },
  shopifyPlan: 'BASIC',
  ourApps: ['BLOY'],
});

describe('fetchProspectsForExport', () => {
  it('exports 650 matches across every page using the supplied arbitrary filter', async () => {
    const rows = Array.from({ length: 650 }, (_, index) => prospect(index));
    const filter: ProspectExportFilter = {
      and: [
        { ourApps: { containsIlike: 'BLOY' } },
        { shopifyPlan: { eq: 'BASIC' } },
      ],
    };
    const queries: Parameters<ProspectExportClient['query']>[0][] = [];
    const client: ProspectExportClient = {
      query: async (query) => {
        queries.push(query);
        const { after, first } = query.prospects.__args;
        const offset = after === undefined ? 0 : Number(after);
        const nextOffset = offset + first;

        return {
          prospects: {
            edges: rows.slice(offset, nextOffset).map((node) => ({ node })),
            pageInfo: {
              hasNextPage: nextOffset < rows.length,
              endCursor: String(nextOffset),
            },
            totalCount: rows.length,
          },
        };
      },
    };

    expect(await fetchProspectsForExport(client, filter)).toEqual(rows);
    expect(queries.length).toBeGreaterThan(1);
    expect(
      queries.every((query) => query.prospects.__args.filter === filter),
    ).toBe(true);
  });

  it('refuses to export with a missing filter configuration', async () => {
    const client: ProspectExportClient = {
      query: async () => {
        throw new Error('must not query');
      },
    };

    await expect(fetchProspectsForExport(client, null)).rejects.toThrow(
      'filter',
    );
  });

  it('fails instead of returning a partial file when a page request fails', async () => {
    let requests = 0;
    const client: ProspectExportClient = {
      query: async () => {
        requests += 1;
        if (requests > 1) throw new Error('Connection lost');

        return {
          prospects: {
            edges: [{ node: prospect(1) }],
            pageInfo: { hasNextPage: true, endCursor: 'next' },
            totalCount: 2,
          },
        };
      },
    };

    await expect(fetchProspectsForExport(client, {})).rejects.toThrow(
      'Connection lost',
    );
  });

  it('rejects an incomplete result instead of silently losing rows', async () => {
    const client: ProspectExportClient = {
      query: async () => ({
        prospects: {
          edges: [{ node: prospect(1) }],
          pageInfo: { hasNextPage: false, endCursor: null },
          totalCount: 2,
        },
      }),
    };

    await expect(fetchProspectsForExport(client, {})).rejects.toThrow('count');
  });

  it('rejects a missing cursor while more pages remain', async () => {
    const client: ProspectExportClient = {
      query: async () => ({
        prospects: {
          edges: [{ node: prospect(1) }],
          pageInfo: { hasNextPage: true, endCursor: null },
          totalCount: 2,
        },
      }),
    };

    await expect(fetchProspectsForExport(client, {})).rejects.toThrow('cursor');
  });
});

describe('buildProspectExportFiles', () => {
  it.each(['csv', 'xlsx'] as const)(
    'exports only the chosen fields in their chosen order in %s',
    (format) => {
      const fields = ['industry', 'domain', 'shopName'].map(
        (name) => PROSPECT_EXPORT_FIELDS.find((field) => field.name === name)!,
      );
      const files = buildProspectExportFiles(
        [{ ...prospect(1), industry: 'Fashion', shopName: 'Example shop' }],
        fields,
      );
      const workbook = read(files[format].base64, { type: 'base64' });
      expect(
        utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
          header: 1,
        }),
      ).toEqual([
        ['Industry', 'Store domain', 'Shop name'],
        ['Fashion', 'shop-1.myshopify.com', 'Example shop'],
      ]);
    },
  );
  it.each(['csv', 'xlsx'] as const)(
    'writes exactly five columns and preserves optional empty cells in %s',
    (format) => {
      const rows = [
        prospect(1),
        {
          ...prospect(2),
          email: null,
          linkedinPage: null,
          shopifyPlan: null,
          ourApps: null,
        },
      ];
      const files = buildProspectExportFiles(rows);
      const workbook = read(files[format].base64, { type: 'base64' });
      const values = utils.sheet_to_json<string[]>(
        workbook.Sheets[workbook.SheetNames[0]],
        { header: 1, defval: '' },
      );

      expect(values).toEqual([
        ['Store domain', 'Email', 'LinkedIn page', 'Shopify plan', 'Our app'],
        [
          rows[0].domain,
          'owner-1@shop.com',
          'https://linkedin.com/company/shop-1',
          'Basic',
          'BLOY',
        ],
        [rows[1].domain, '', '', '', ''],
      ]);
    },
  );

  it.each(['csv', 'xlsx'] as const)(
    'keeps commas, quotes, newlines, Unicode and multiple apps in %s',
    (format) => {
      const row = {
        ...prospect(1),
        domain: 'Cửa hàng, "test"\nshop.com',
        ourApps: ['MIDA', 'BLOY'],
      };
      const files = buildProspectExportFiles([row]);
      const workbook = read(files[format].base64, { type: 'base64' });
      const values = utils.sheet_to_json<string[]>(
        workbook.Sheets[workbook.SheetNames[0]],
        { header: 1 },
      );

      expect(values[1][0]).toBe(row.domain);
      expect(values[1][4]).toBe('MIDA; BLOY');
    },
  );

  it('writes formula-like values as text in Excel', () => {
    const files = buildProspectExportFiles([
      { ...prospect(1), domain: '=1+1' },
    ]);
    const workbook = read(files.xlsx.base64, { type: 'base64' });

    expect(workbook.Sheets[workbook.SheetNames[0]].A2).toMatchObject({
      t: 's',
      v: '=1+1',
    });
    expect(workbook.Sheets[workbook.SheetNames[0]].A2.f).toBeUndefined();
  });

  it('neutralizes formula-like values in CSV', () => {
    const files = buildProspectExportFiles([
      { ...prospect(1), domain: '=1+1' },
    ]);
    const csv = Buffer.from(files.csv.base64, 'base64').toString('utf8');

    expect(csv).not.toMatch(/\n=1\+1,/);
    expect(csv).toContain('=1+1');
  });

  it('exports a header-only file when no records match', () => {
    const files = buildProspectExportFiles([]);
    const workbook = read(files.xlsx.base64, { type: 'base64' });

    expect(
      utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
        header: 1,
      }),
    ).toHaveLength(1);
  });
});
