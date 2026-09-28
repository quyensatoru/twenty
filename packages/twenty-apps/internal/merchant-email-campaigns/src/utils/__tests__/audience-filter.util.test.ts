import { describe, expect, it } from 'vitest';

import { EMPTY_AUDIENCE_FILTER } from '../../constants/empty-audience-filter';
import { buildMerchantGraphqlFilter } from '../build-merchant-graphql-filter.util';
import { matchesAudienceFilter } from '../matches-audience-filter.util';
import { parseAudienceFilter } from '../parse-audience-filter.util';

describe('parseAudienceFilter', () => {
  it('normalises bad input', () => {
    expect(parseAudienceFilter(undefined)).toEqual(EMPTY_AUDIENCE_FILTER);
    expect(
      parseAudienceFilter({ appIds: ['a', 3, ' '], installStatus: 'NOPE' }),
    ).toEqual({
      ...EMPTY_AUDIENCE_FILTER,
      appIds: ['a'],
    });
  });
});

describe('buildMerchantGraphqlFilter', () => {
  it('always excludes merchants without email or unsubscribed', () => {
    expect(buildMerchantGraphqlFilter(EMPTY_AUDIENCE_FILTER)).toEqual({
      and: [
        { email: { primaryEmail: { neq: '' } } },
        { not: { emailUnsubscribed: { eq: true } } },
      ],
    });
  });

  it('treats a missing install flag as installed', () => {
    const filter = buildMerchantGraphqlFilter({
      ...EMPTY_AUDIENCE_FILTER,
      installStatus: 'INSTALLED',
      appIds: ['app-1'],
    });

    expect(filter.and).toContainEqual({ appId: { in: ['app-1'] } });
    expect(filter.and).toContainEqual({
      or: [{ using: { eq: true } }, { using: { is: 'NULL' } }],
    });
  });
});

describe('matchesAudienceFilter', () => {
  const merchant = {
    id: 'm',
    appId: 'app-1',
    using: false,
    shopifyPlan: 'BASIC',
    country: 'US',
  };

  it('matches the uninstalled segment of an app', () => {
    expect(
      matchesAudienceFilter(merchant, {
        ...EMPTY_AUDIENCE_FILTER,
        appIds: ['app-1'],
        installStatus: 'UNINSTALLED',
      }),
    ).toBe(true);
  });

  it('rejects on any mismatching list', () => {
    expect(
      matchesAudienceFilter(merchant, {
        ...EMPTY_AUDIENCE_FILTER,
        shopifyPlans: ['PLUS'],
      }),
    ).toBe(false);
    expect(
      matchesAudienceFilter(merchant, {
        ...EMPTY_AUDIENCE_FILTER,
        installStatus: 'INSTALLED',
      }),
    ).toBe(false);
  });
});
