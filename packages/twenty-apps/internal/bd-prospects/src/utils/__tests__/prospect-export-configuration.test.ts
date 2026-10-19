import { describe, expect, it } from 'vitest';

import {
  buildProspectExportFilter,
  PROSPECT_EXPORT_FIELDS,
  type ProspectExportRule,
} from '../prospect-export-configuration';

const rule = (
  fieldName: string,
  operator: ProspectExportRule['operator'],
  values: string[],
): ProspectExportRule => ({
  id: fieldName + operator,
  fieldName,
  operator,
  values,
});

describe('buildProspectExportFilter', () => {
  it('exports all prospects with no filters and no record selection', () => {
    expect(buildProspectExportFilter([], 'and')).toEqual({});
  });

  it('combines app inclusion, multiple plans and app exclusion without fixing their values', () => {
    const filter = buildProspectExportFilter(
      [
        rule('ourApps', 'contains', ['BLOY']),
        rule('shopifyPlan', 'is', ['BASIC', 'SHOPIFY']),
        rule('ourApps', 'doesNotContain', ['MIDA']),
      ],
      'and',
    );

    expect(filter).toEqual({
      and: [
        { ourApps: { containsAny: ['BLOY'] } },
        { shopifyPlan: { in: ['BASIC', 'SHOPIFY'] } },
        {
          or: [
            { not: { ourApps: { containsAny: ['MIDA'] } } },
            { ourApps: { isEmptyArray: true } },
            { ourApps: { is: 'NULL' } },
          ],
        },
      ],
    });
  });

  it('allows OR conditions on different fields', () => {
    expect(
      buildProspectExportFilter(
        [
          rule('domain', 'contains', ['fashion']),
          rule('industry', 'is', ['Beauty']),
        ],
        'or',
      ),
    ).toEqual({
      or: [{ domain: { ilike: '%fashion%' } }, { industry: { eq: 'Beauty' } }],
    });
  });

  it('filters the primary email and LinkedIn values', () => {
    expect(
      buildProspectExportFilter(
        [
          rule('email', 'contains', ['@shop.com']),
          rule('linkedinPage', 'is', ['https://linkedin.com/company/shop']),
        ],
        'and',
      ),
    ).toEqual({
      and: [
        { email: { primaryEmail: { ilike: '%@shop.com%' } } },
        {
          linkedinPage: {
            primaryLinkUrl: { eq: 'https://linkedin.com/company/shop' },
          },
        },
      ],
    });
  });

  it('filters missing contact details without dropping stores', () => {
    expect(
      buildProspectExportFilter([rule('email', 'isEmpty', [])], 'and'),
    ).toEqual({
      and: [
        {
          or: [
            { email: { primaryEmail: { is: 'NULL' } } },
            { email: { primaryEmail: { eq: '' } } },
          ],
        },
      ],
    });
  });

  it('checks a missing Shopify plan without submitting an invalid empty enum', () => {
    expect(
      buildProspectExportFilter([rule('shopifyPlan', 'isEmpty', [])], 'and'),
    ).toEqual({ and: [{ shopifyPlan: { is: 'NULL' } }] });
  });

  it('rejects unfinished rules instead of silently exporting a broader list', () => {
    expect(() =>
      buildProspectExportFilter([rule('ourApps', 'contains', [])], 'and'),
    ).toThrow();
    expect(() =>
      buildProspectExportFilter([rule('domain', 'contains', [' '])], 'and'),
    ).toThrow();
  });

  it('rejects unknown fields or operators', () => {
    expect(() =>
      buildProspectExportFilter([rule('unknown', 'is', ['x'])], 'and'),
    ).toThrow();
    expect(() =>
      buildProspectExportFilter(
        [rule('shopifyPlan', 'before', ['2026-01-01'])],
        'and',
      ),
    ).toThrow();
  });

  it('provides every scalar prospect field declared by the application', () => {
    const names = PROSPECT_EXPORT_FIELDS.map((field) => field.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'domain',
        'email',
        'linkedinPage',
        'shopName',
        'industry',
        'crispEmail',
        'otherApps',
        'midaStage',
        'bloyStage',
        'lastSyncedAt',
      ]),
    );
  });
});
