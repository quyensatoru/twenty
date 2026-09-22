import { describe, expect, it } from 'vitest';

import { buildImportPlan } from '../build-import-plan';
import { computeProspectId } from '../prospect-id';
import { type ParsedProspectRow } from '../parse-prospect-csv';

const row = (overrides: Partial<ParsedProspectRow>): ParsedProspectRow => ({
  lineNumber: 2,
  domain: 'abc.myshopify.com',
  shopName: null,
  email: null,
  shopifyPlan: null,
  appKey: 'MIDA',
  industry: null,
  ...overrides,
});

describe('buildImportPlan', () => {
  it('should fold rows of the same shop into one draft', () => {
    const drafts = buildImportPlan([
      row({ lineNumber: 2, appKey: 'MIDA', shopifyPlan: 'ADVANCED' }),
      row({ lineNumber: 3, appKey: 'OTHER_APP', shopifyPlan: 'PLUS' }),
    ]);

    expect(drafts).toHaveLength(1);
    expect(drafts[0].appKeys).toEqual(['MIDA', 'OTHER_APP']);
    expect(drafts[0].shopifyPlan).toBe('PLUS');
    expect(drafts[0].lineNumbers).toEqual([2, 3]);
  });

  it('should keep the first non-empty shop name, email and industry', () => {
    const drafts = buildImportPlan([
      row({ lineNumber: 2, shopName: null, email: null, industry: null }),
      row({
        lineNumber: 3,
        shopName: 'ABC Store',
        email: 'owner@abc.com',
        industry: 'Fashion',
      }),
    ]);

    expect(drafts[0].shopName).toBe('ABC Store');
    expect(drafts[0].email).toBe('owner@abc.com');
    expect(drafts[0].industry).toBe('Fashion');
  });

  it('should give each shop the id derived from its domain', () => {
    const drafts = buildImportPlan([row({})]);

    expect(drafts[0].prospectId).toBe(computeProspectId('abc.myshopify.com'));
  });

  it('should keep different shops apart', () => {
    const drafts = buildImportPlan([
      row({ domain: 'abc.myshopify.com' }),
      row({ domain: 'xyz.myshopify.com' }),
    ]);

    expect(drafts).toHaveLength(2);
  });
});
