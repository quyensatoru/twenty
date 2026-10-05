import { describe, expect, it } from 'vitest';

import { buildLinkedinQueries } from '../build-linkedin-queries';

describe('buildLinkedinQueries', () => {
  it('prefers the shop name and still covers the domain', () => {
    expect(
      buildLinkedinQueries({ domain: 'acmestore.com', shopName: 'Acme Store' }),
    ).toEqual([
      '"Acme Store" linkedin company',
      'acmestore.com linkedin',
      'site:linkedin.com/company "Acme Store"',
    ]);
  });

  it('derives the brand from a myshopify subdomain without a shop name', () => {
    expect(
      buildLinkedinQueries({ domain: 'my-cool-store.myshopify.com' }),
    ).toEqual([
      '"my cool store" linkedin company',
      'my-cool-store.myshopify.com linkedin',
      'site:linkedin.com/company "my cool store"',
    ]);
  });

  it('adds an email-domain query when it differs from the shop domain', () => {
    expect(
      buildLinkedinQueries({
        domain: 'acmestore.com',
        email: 'owner@acme-group.com',
      }),
    ).toContain('acme-group.com linkedin');
  });

  it('returns no queries for a blank domain', () => {
    expect(buildLinkedinQueries({ domain: '   ' })).toEqual([]);
  });
});
