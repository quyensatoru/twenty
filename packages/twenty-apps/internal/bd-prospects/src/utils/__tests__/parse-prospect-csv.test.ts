import { describe, expect, it } from 'vitest';

import { parseProspectCsv } from '../parse-prospect-csv';

describe('parseProspectCsv', () => {
  it('should parse a well-formed file', () => {
    const { rows, errors } = parseProspectCsv(
      [
        'domain,shopName,email,shopifyPlan,app,industry',
        'ABC.myshopify.com,ABC Store,Owner@ABC.com,PLUS,MIDA,Fashion',
        'xyz.myshopify.com,,,advanced,Mida,',
      ].join('\n'),
    );

    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      domain: 'abc.myshopify.com',
      shopName: 'ABC Store',
      email: 'owner@abc.com',
      shopifyPlan: 'PLUS',
      appKey: 'MIDA',
      industry: 'Fashion',
    });
    expect(rows[1]).toMatchObject({
      domain: 'xyz.myshopify.com',
      shopName: null,
      email: null,
      shopifyPlan: 'ADVANCED',
      appKey: 'MIDA',
      industry: null,
    });
  });

  it('should report the line number of an invalid domain and keep the other rows', () => {
    const { rows, errors } = parseProspectCsv(
      [
        'domain,app',
        'abc.myshopify.com,MIDA',
        'not a domain,MIDA',
        'xyz.myshopify.com,MIDA',
      ].join('\n'),
    );

    expect(rows).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0].lineNumber).toBe(3);
  });

  it('should reject a file missing a required column', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,industry\nabc.myshopify.com,Fashion',
    );

    expect(rows).toEqual([]);
    expect(errors[0].message).toContain('app');
  });

  it('should keep an app nobody has declared, rather than rejecting the row', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,app\nabc.myshopify.com,Checkout X',
    );

    expect(errors).toEqual([]);
    expect(rows[0].appKey).toBe('CHECKOUT_X');
  });

  it('should accept one of our apps whatever the casing', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,app\nabc.myshopify.com,bloy',
    );

    expect(errors).toEqual([]);
    expect(rows[0].appKey).toBe('BLOY');
  });

  it('should reject a malformed email and name it', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,app,email\nabc.myshopify.com,MIDA,not-an-email',
    );

    expect(rows).toEqual([]);
    expect(errors[0].message).toContain('Invalid email');
  });

  it('should reject an unknown Shopify plan rather than guessing', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,app,shopifyPlan\nabc.myshopify.com,MIDA,Enterprise',
    );

    expect(rows).toEqual([]);
    expect(errors[0].message).toContain('Unknown Shopify plan');
  });

  it('should handle quoted fields, embedded commas and CRLF', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,shopName,app\r\nabc.myshopify.com,"Store, The ""Best""",MIDA\r\n',
    );

    expect(errors).toEqual([]);
    expect(rows[0].shopName).toBe('Store, The "Best"');
  });

  it('should list unknown columns instead of failing on them', () => {
    const { rows, ignoredColumns } = parseProspectCsv(
      'domain,app,installedAt\nabc.myshopify.com,MIDA,2025-01-12',
    );

    expect(rows).toHaveLength(1);
    expect(ignoredColumns).toEqual(['installedAt']);
  });

  it('should skip blank lines', () => {
    const { rows, errors } = parseProspectCsv(
      'domain,app\nabc.myshopify.com,MIDA\n\n',
    );

    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });
});
